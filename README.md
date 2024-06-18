# Solana ICO Presale Program

This project is a Solana-based ICO presale program using the Anchor framework. It allows users to participate in the ICO by purchasing tokens with SOL.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Rust and Cargo installed.
- Solana CLI installed and configured.
- Anchor framework installed.

## Steps to Set Up and Deploy the Program

### 1. Create a Token

1. **Create a token of the desired decimal value and supply**:
    ```sh
    solana-token create-token --decimals <DECIMALS>
    ```
   This command will output the `TOKEN_MINT_ADDRESS`.

2. **Create a token account**:
    ```sh
    solana-token create-account <TOKEN_MINT_ADDRESS>
    ```

### 2. Update the Program with the New Token Mint Address

1. **Replace the `TOKEN_MINT_ADDRESS` in `lib.rs`**:
    ```rust
    pub const TOKEN_MINT_ADDRESS: &str = "<NEW_GENERATED_TOKEN_MINT_ADDRESS>";
    ```

### 3. Build and Deploy the Program

1. **Build the program**:
    ```sh
    anchor build
    ```

2. **Set the program ID**:
    Update `declare_id!` in `lib.rs` with the generated program ID.
    ```rust
    declare_id!("<YOUR_PROGRAM_ID>");
    ```

3. **Deploy the program**:
    ```sh
    anchor deploy
    ```

### 4. Integration and Testing

1. **Provide the following to the frontend team**:
   - The generated `.json` file from the `target/idl` folder that was generated after the `anchor build`.
   - Admin account keypair.
   - Admin token account address.
   - Token mint address.

2. **Testing the Program**:
    - Navigate to the `/app` folder.
    - The app folder contains a basic UI for testing most of the functions from the program.
    - Connect wallet to see all the different function related buttons.
    - Click the `CreateIcoATA` button to initiate the program, add funds to program associated token account and start the presale.
    - `DepositIcoInATA` can be used to add more funds to the program associated token account.

## Program Structure

### Accounts

- **CreateIcoATA**
- **DepositIcoInATA**
- **BuyWithSol**
- **StartSale**
- **PauseSale**
- **UpdateData**

### Data

- **Data**:
    - `sol`: The price of SOL.
    - `admin`: The admin public key.
    - `is_active`: Boolean indicating if the sale is active.
    - `max_purchase_amount`: The maximum purchase amount.

### Error Codes

- **PresalePaused**: Presale is currently paused.
- **ExceedsMaxPurchase**: Purchase amount exceeds the maximum allowed.

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request.

---

Happy Coding!
