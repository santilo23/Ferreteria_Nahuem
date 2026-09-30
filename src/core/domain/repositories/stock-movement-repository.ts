import { StockMovement } from '../entities/stock-movement'

export interface IStockMovementRepository {
  save(movement: StockMovement): Promise<void>
  findByProductId(productId: string): Promise<StockMovement[]>
  findAll(): Promise<StockMovement[]>
}
