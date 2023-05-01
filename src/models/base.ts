import { v4 } from 'uuid';

export class BaseModel {
  id: string;

  public static generateId(): string {
    return v4();
  }
}
