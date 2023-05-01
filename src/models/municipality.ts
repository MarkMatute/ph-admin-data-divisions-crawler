import { BaseModel } from './base';

export default class Municipality extends BaseModel {
  regionId: string;
  provinceId: string;
  name: string;
  link: string;
}
