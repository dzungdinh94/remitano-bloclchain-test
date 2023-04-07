use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint};

declare_id!("GP5NgbhRYiPWDWm3AhUFwym3rYCuUjHWPkHyrmeotZ19");

#[program]
pub mod swap_sol_for_move {
    use super::*;
    pub fn swap_sol_for_move(ctx: Context<SwapSolToMove>, amount: u64) -> Result<()> {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user_sol_account.to_account_info(),
                    to: ctx.accounts.contract_sol_account.to_account_info(),
                }
            ),
            amount
        )?;

        let cpi_program = ctx.accounts.token_program.to_account_info();


        // Transfer MOVE tokens from the pool to the user
        let move_amount = 10 * amount;
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.move_mint.to_account_info(),
            to: ctx.accounts.user_move_account.to_account_info(),
            authority:  ctx.accounts.user_sol_account.to_account_info(),
        };

        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_context, move_amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SwapSolToMove<'info> {
    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub user_sol_account: Signer<'info>,
    /// CHECK:` doc comment explaining why no checks through types are necessary
    #[account(mut)]
    pub user_move_account: AccountInfo<'info>,
    #[account(mut)]
    pub move_mint:  Account<'info, Mint>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    pub token_program: AccountInfo<'info>,
    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(mut)]
    pub contract_sol_account: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
}
