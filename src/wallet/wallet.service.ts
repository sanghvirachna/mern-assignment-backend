import { Injectable, BadRequestException } from '@nestjs/common';

type Wallet = {
  userId: string;
  balance: number;
};

const wallets: Record<string, Wallet> = {
  u1: { userId: 'u1', balance: 100 },
};

@Injectable()
export class WalletService {
  /**
   * Simple locking mechanism to prevent race conditions during concurrent balance updates.
   * Maps userId to a Promise that resolves when the current operation completes.
   */
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Helper to execute an operation on a user's wallet with an exclusive lock.
   */
  private async withLock<T>(userId: string, op: () => Promise<T>): Promise<T> {
    // Get the existing lock for this user, or a resolved promise if none exists.
    const lock = this.locks.get(userId) || Promise.resolve();

    // Create a new promise that will wait for the current lock, then run the operation.
    const nextLock = lock
      .then(async () => {
        try {
          return await op();
        } finally {
          // Once this operation finishes, if we're still the active lock, clean up.
          // Note: In a high-traffic system, cleanup might be more complex.
          if (this.locks.get(userId) === nextLock) {
            this.locks.delete(userId);
          }
        }
      })
      .catch((err) => {
        // Ensure the lock chain continues even if an operation fails.
        if (this.locks.get(userId) === nextLock) {
          this.locks.delete(userId);
        }
        throw err;
      });

    // Update the lock map with the new promise.
    this.locks.set(userId, nextLock.then(() => {}));

    return nextLock;
  }

  /**
   * Returns the current balance for a user.
   */
  async getBalance(userId: string): Promise<number> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return wallets[userId]?.balance ?? 0;
  }

  /**
   * Credits the user's wallet with the specified amount.
   * Creates a wallet entry if one doesn't exist.
   */
  async credit(userId: string, amount: number): Promise<number> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.withLock(userId, async () => {
      if (!wallets[userId]) {
        wallets[userId] = { userId, balance: 0 };
      }
      wallets[userId].balance += amount;
      return wallets[userId].balance;
    });
  }

  /**
   * Debits the user's wallet if they have sufficient balance.
   */
  async debit(userId: string, amount: number): Promise<Wallet> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.withLock(userId, async () => {
      const wallet = wallets[userId];

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      wallet.balance -= amount;
      return wallet;
    });
  }
}
