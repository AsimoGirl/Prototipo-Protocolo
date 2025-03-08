use anchor_lang::prelude::*;
use solana_program::pubkey;

declare_id!("2GZpFfWAgy1YeUbhvCpvo3r8L7Z9jWzuHPdAWSqpD4UQ");

const BOB_ADDRESS: Pubkey = pubkey!("D6EHkYNuxkQ8BhXJqoBm17CjhuiaFNcSMRJ3yovv23Cm");
const PCN_ADDRESS: Pubkey = pubkey!("2MCuBFEEWXHAqKMeZa9GUHLiRiMXqWPR5zmc9TEARUo4");

#[program]
pub mod protocol_actions_scb_test {
    use super::*;
    /// 0) Initialize the ProgramState account.
    ///
    /// You only need to do this once. After it's created, you can reuse it
    /// for all subsequent calls to `verify_and_emit` (or other instructions).
    ///
    /// The `initialize_program_state` instruction:
    /// - Creates a new ProgramState account owned by this program.
    /// - Initializes `state` to `false`.
    pub fn initialize_program_state(ctx: Context<InitializeProgramState>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.state = false;
        msg!("ProgramState initialized. state=false");
        Ok(())
    }

    /// 1) Start the protocol.
    pub fn start_protocol(
        ctx: Context<InstructionProtocol>,
        message_request: String,
    ) -> Result<()> {
        // If signer doesn't match, emit the event with an error description and fail the tx.
        if ctx.accounts.signer.key() != PCN_ADDRESS {
            emit!(ProtocolStartErrorB {
                starter: ctx.accounts.signer.key(),
                description: "ProtocolStartErrorB: There was an error with the start, couldn't validate signature".to_string(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidSignature);
        }

        if message_request == "messageStart" {
            emit!(ProtocolStartedB {
                starter: ctx.accounts.signer.key(),
                description: "ProtocolStartedB: Protocol Started Successfully".to_string(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            let program_state = &mut ctx.accounts.program_state;
            program_state.state = true;
            msg!("ProtocolStartedB: Protocol Started Successfully");
        } else {
            emit!(ProtocolStartErrorB {
                starter: ctx.accounts.signer.key(),
                description: "ProtocolStartErrorB: Could not validate message operation"
                    .to_string(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidOperation);
        }
        Ok(())
    }

    /// 2) Get the transfer info.
    pub fn get_transfer_info(
        ctx: Context<InstructionProtocol>,
        message_request: String,
        transaction_message: String,
    ) -> Result<()> {
        //Verify signer
        if ctx.accounts.signer.key() != PCN_ADDRESS {
            emit!(TransferMessageErrorB {
                starter: ctx.accounts.signer.key(),
                description: "TransferMessageErrorB: There was an error with the message, couldn't validate signature".to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidSignature);
        }

        //Verify if the protocol is active
        if !ctx.accounts.program_state.state {
            emit!(TransferMessageErrorB {
                starter: ctx.accounts.signer.key(),
                description: "TransferMessageErrorB: Protocol is not active".to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::ProtocolNotActive);
        }

        //Verify the message operation
        if message_request == "messageGetInfo" {
            emit!(TransferMessageCommittedB {
                starter: ctx.accounts.signer.key(),
                description: "TransferMessageCommittedB: The signer requests transmitting the attached message"
                    .to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            msg!("TransferMessageCommittedB: The signer requests transmitting the attached message: {}", transaction_message.to_string());
        } else {
            emit!(TransferMessageErrorB {
                starter: ctx.accounts.signer.key(),
                description: "TransferMessageErrorB: Operation sent is not valid".to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidOperation);
        }
        Ok(())
    }

    /// 3) Acknowledge the transfer info.
    pub fn get_acknowledge(
        ctx: Context<InstructionProtocol>,
        message_request: String,
        transaction_message: String,
    ) -> Result<()> {
        //Verify signer
        if ctx.accounts.signer.key() != BOB_ADDRESS {
            emit!(AcknowledgeMessageErrorB {
                starter: ctx.accounts.signer.key(),
                description: "AcknowledgeMessageErrorB: There was an error with the message, couldn't validate signature".to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidSignature);
        }

        //Verify if the protocol is active
        if !ctx.accounts.program_state.state {
            emit!(AcknowledgeMessageErrorB {
                starter: ctx.accounts.signer.key(),
                description: "AcknowledgeMessageErrorB: Protocol is not active".to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::ProtocolNotActive);
        }

        //Verify the message operation
        if message_request == "messageAcknowledge" {
            emit!(AcknowledgeMessageCommittedB {
                starter: ctx.accounts.signer.key(),
                description: "AcknowledgeMessageCommittedB: The signer requests transmitting the attached message"
                    .to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            msg!("AcknowledgeMessageCommittedB: The signer requests transmitting the attached message: {}", transaction_message.to_string());
        } else {
            emit!(AcknowledgeMessageErrorB {
                starter: ctx.accounts.signer.key(),
                description: "AcknowledgeMessageErrorB: Operation sent is not valid".to_string(),
                message_content: transaction_message.clone(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidOperation);
        }
        Ok(())
    }

    /// 4) Finish the protocol.
    pub fn finish_protocol(
        ctx: Context<InstructionProtocol>,
        message_request: String,
    ) -> Result<()> {
        // If signer doesn't match, emit the event with an error description and fail the tx.
        if ctx.accounts.signer.key() != PCN_ADDRESS {
            emit!(ProtocolFinishedErrorB {
                starter: ctx.accounts.signer.key(),
                description: "ProtocolFinishedErrorB: There was an error with the finish, couldn't validate signature".to_string(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidSignature);
        }

        //Verify if the protocol is active
        if !ctx.accounts.program_state.state {
            emit!(ProtocolFinishedErrorB {
                starter: ctx.accounts.signer.key(),
                description: "ProtocolFinishedErrorB: Protocol is not active".to_string(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::ProtocolNotActive);
        }

        if message_request == "messageFinish" {
            emit!(ProtocolFinishedB {
                starter: ctx.accounts.signer.key(),
                description: "ProtocolFinishedB: Protocol Finished Successfully".to_string(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            let program_state = &mut ctx.accounts.program_state;
            program_state.state = false;
            msg!("ProtocolFinishedB: Protocol Finished Successfully");
        } else {
            emit!(ProtocolFinishedErrorB {
                starter: ctx.accounts.signer.key(),
                description: "ProtocolFinishedErrorB: Could not validate message operation"
                    .to_string(),
                timestamp: Clock::get()?.unix_timestamp,
            });
            return err!(ProtocolError::InvalidOperation);
        }
        Ok(())
    }
}

// ============================================================================
//  Context Definitions
// ============================================================================
/// The `InitializeProgramState` context:
/// - Creates a new `ProgramState` account with `init`.
/// - Payer covers the rent (minimum SOL balance) to store the data on chain.
#[derive(Accounts)]
pub struct InitializeProgramState<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + ProgramState::SIZE
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// The `VerifySigner` context:
/// - Expects an existing `ProgramState` account (must be passed in).
/// - The `signer` must match the transaction's signer.
#[derive(Accounts)]
pub struct InstructionProtocol<'info> {
    /// CHECK: This account is not deserialized and is used only as a signer
    #[account(signer)]
    pub signer: AccountInfo<'info>,

    // We mark program_state as mutable, since we'll set `state = true`.
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
}

/// A program-owned account that stores our boolean state (and potentially more data).
#[account]
pub struct ProgramState {
    pub state: bool,
}

impl ProgramState {
    // If we plan to store more data in the future, we can keep a static size for convenience.
    // For now, we only store `bool`, which is 1 byte, but each account has an 8-byte anchor
    // discriminator. We'll define a simple constant for clarity.
    pub const SIZE: usize = 1; // only 'state' plus the 8-byte Anchor discriminator is auto-included.
}

// ============================================================================
//  Custom Errors
// ============================================================================
#[error_code]
pub enum ProtocolError {
    #[msg("Protocol is not currently active")]
    ProtocolNotActive,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Invalid operation")]
    InvalidOperation,
}

// ============================================================================
//  Events (Anchor logs)
// ============================================================================
#[event]
pub struct ProtocolStartedB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolStartErrorB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub timestamp: i64,
}

#[event]
pub struct TransferMessageCommittedB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub message_content: String,
    pub timestamp: i64,
}

#[event]
pub struct TransferMessageErrorB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub message_content: String,
    pub timestamp: i64,
}

#[event]
pub struct AcknowledgeMessageCommittedB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub message_content: String,
    pub timestamp: i64,
}

#[event]
pub struct AcknowledgeMessageErrorB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub message_content: String,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolFinishedB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolFinishedErrorB {
    #[index]
    pub starter: Pubkey,
    pub description: String,
    pub timestamp: i64,
}
