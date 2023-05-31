use anchor_lang::error_code;

#[error_code]
pub enum EscrowError {
    #[msg("Unable to get auth bump")]
    AuthBumpError,
    #[msg("Unable to get vault bump")]
    VaultBumpError,
    #[msg("Unable to get escrow bump")]
    EscrowBumpError,
    #[msg("Expiry is too far into the future")]
    ExpiryOutOfBounds,
    #[msg("Escrow expired")]
    Expired,
}