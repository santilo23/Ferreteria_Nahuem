import { Receipt } from '../entities/receipt'

export interface IReceiptRepository {
  save(receipt: Receipt): Promise<void>
  findById(id: string): Promise<Receipt | null>
  findAll(): Promise<Receipt[]>
}
