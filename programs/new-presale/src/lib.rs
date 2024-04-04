use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_spl::token::{ self, Mint, Token, TokenAccount };

declare_id!("CKJKx8AWRdtz4ZPVQhdx5DA8JdJEnrUprEdVVeQLx7nY");

#[program]
pub mod new_presale {
    pub const TOKEN_MINT_ADDRESS: &str = "Wpmdtahg9TSfPRD465P4TdncXrJo53EMyKkvaBqCtRm";
    use super::*;

    pub fn create_ico_ata(
        ctx: Context<CreateIcoATA>,
        ico_amount: u64,
        sol_price: u64,
        max_purchase_amount: u64
    ) -> Result<()> {
        msg!("create program ATA for hold FZI");
        // transfer ICO admin to program ata
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.ico_ata_for_admin.to_account_info(),
                to: ctx.accounts.ico_ata_for_ico_program.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            }
        );
        token::transfer(cpi_ctx, ico_amount)?;
        msg!("send {} FZI to program ATA.", ico_amount);

        // save data in data PDA
        let data = &mut ctx.accounts.data;
        data.sol = sol_price;
        data.max_purchase_amount = max_purchase_amount;
        data.admin = *ctx.accounts.admin.key;
        msg!("saved data in program PDA.");
        Ok(())
    }

    pub fn deposit_ico_in_ata(ctx: Context<DepositIcoInATA>, ico_amount: u64) -> ProgramResult {
        if ctx.accounts.data.admin != *ctx.accounts.admin.key {
            return Err(ProgramError::IncorrectProgramId);
        }
        // transfer ICO admin to program ata
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.ico_ata_for_admin.to_account_info(),
                to: ctx.accounts.ico_ata_for_ico_program.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            }
        );
        token::transfer(cpi_ctx, ico_amount)?;
        msg!("deposit {} FZI in program ATA.", ico_amount);
        Ok(())
    }

    pub fn buy_with_sol(
        ctx: Context<BuyWithSol>,
        _ico_ata_for_ico_program_bump: u8,
        sol_amount: u64
    ) -> Result<()> {
        require!(ctx.accounts.data.is_active, ErrorCode::PresalePaused);
        require!(sol_amount <= ctx.accounts.data.max_purchase_amount, ErrorCode::ExceedsMaxPurchase);
        // transfer sol from user to admin
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.admin.key(),
            sol_amount
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[ctx.accounts.user.to_account_info(), ctx.accounts.admin.to_account_info()]
        )?;
        msg!("transfer {} sol to admin.", sol_amount);

        // transfer ICO from program to user ATA
        let ico_amount = sol_amount * ctx.accounts.data.sol;
        let ico_mint_address = ctx.accounts.ico_mint.key();
        let seeds = &[ico_mint_address.as_ref(), &[_ico_ata_for_ico_program_bump]];
        let signer = [&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.ico_ata_for_ico_program.to_account_info(),
                to: ctx.accounts.ico_ata_for_user.to_account_info(),
                authority: ctx.accounts.ico_ata_for_ico_program.to_account_info(),
            },
            &signer
        );
        token::transfer(cpi_ctx, ico_amount)?;
        msg!("transfer {} FZI to buyer/user.", ico_amount);
        Ok(())
    }

    pub fn update_data(
        ctx: Context<UpdateData>,
        sol_price: u64,
        max_purchase_amount: u64
    ) -> ProgramResult {
        if ctx.accounts.data.admin != *ctx.accounts.admin.key {
            return Err(ProgramError::IncorrectProgramId);
        }
        let data = &mut ctx.accounts.data;
        data.sol = sol_price;
        data.max_purchase_amount = max_purchase_amount;
        msg!("update SOL/FZI {} and MAX_AMNT {}", sol_price, max_purchase_amount);
        Ok(())
    }

    pub fn start_sale(ctx: Context<StartSale>) -> ProgramResult {
        if ctx.accounts.data.admin != *ctx.accounts.admin.key {
            return Err(ProgramError::IncorrectProgramId);
        }
        let data = &mut ctx.accounts.data;
        data.is_active = true;
        msg!("Sale is active.");
        Ok(())
    }

    pub fn pause_sale(ctx: Context<PauseSale>) -> ProgramResult {
        if ctx.accounts.data.admin != *ctx.accounts.admin.key {
            return Err(ProgramError::IncorrectProgramId);
        }
        let data = &mut ctx.accounts.data;
        data.is_active = false;
        msg!("Sale is not active.");
        Ok(())
    }

    #[derive(Accounts)]
    pub struct CreateIcoATA<'info> {
        // 1. PDA (pubkey) for ico ATA for our program.
        // seeds: [ico_mint + current program id] => "HashMap[seeds+bump] = pda"
        // token::mint: Token Program wants to know what kind of token this ATA is for
        // token::authority: It's a PDA so the authority is itself!
        #[account(
            init,
            payer = admin,
            seeds = [TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap().as_ref()],
            bump,
            token::mint = ico_mint,
            token::authority = ico_ata_for_ico_program
        )]
        pub ico_ata_for_ico_program: Account<'info, TokenAccount>,

        #[account(init, payer = admin, space = 9000, seeds = [b"data", admin.key().as_ref()], bump)]
        pub data: Account<'info, Data>,

        #[account(address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap())]
        pub ico_mint: Account<'info, Mint>,

        #[account(mut)]
        pub ico_ata_for_admin: Account<'info, TokenAccount>,

        #[account(mut)]
        pub admin: Signer<'info>,

        pub system_program: Program<'info, System>,
        pub token_program: Program<'info, Token>,
        pub rent: Sysvar<'info, Rent>,
    }

    #[derive(Accounts)]
    pub struct DepositIcoInATA<'info> {
        #[account(mut)]
        pub ico_ata_for_ico_program: Account<'info, TokenAccount>,

        #[account(mut)]
        pub data: Account<'info, Data>,

        #[account(address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap())]
        pub ico_mint: Account<'info, Mint>,

        #[account(mut)]
        pub ico_ata_for_admin: Account<'info, TokenAccount>,

        #[account(mut)]
        pub admin: Signer<'info>,
        pub token_program: Program<'info, Token>,
    }

    #[derive(Accounts)]
    #[instruction(_ico_ata_for_ico_program_bump: u8)]
    pub struct BuyWithSol<'info> {
        #[account(
            mut,
            seeds = [ ico_mint.key().as_ref() ],
            bump = _ico_ata_for_ico_program_bump,
        )]
        pub ico_ata_for_ico_program: Account<'info, TokenAccount>,

        #[account(mut)]
        pub data: Account<'info, Data>,

        #[account(address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap())]
        pub ico_mint: Account<'info, Mint>,

        #[account(mut)]
        pub ico_ata_for_user: Account<'info, TokenAccount>,

        #[account(mut)]
        pub user: Signer<'info>,

        /// CHECK:
        #[account(mut)]
        pub admin: AccountInfo<'info>,

        pub token_program: Program<'info, Token>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct StartSale<'info> {
        #[account(mut)]
        pub data: Account<'info, Data>,
        #[account(mut)]
        pub admin: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct PauseSale<'info> {
        #[account(mut)]
        pub data: Account<'info, Data>,
        #[account(mut)]
        pub admin: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct UpdateData<'info> {
        #[account(mut)]
        pub data: Account<'info, Data>,
        #[account(mut)]
        pub admin: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[account]
    pub struct Data {
        pub sol: u64,
        pub admin: Pubkey,
        pub is_active: bool,
        pub max_purchase_amount: u64,
    }

    #[error_code]
    pub enum ErrorCode {
        #[msg("Presale is currently paused.")]
        PresalePaused,
        #[msg("Purchase amount exceeds the maximum allowed.")]
        ExceedsMaxPurchase,
    }
}
