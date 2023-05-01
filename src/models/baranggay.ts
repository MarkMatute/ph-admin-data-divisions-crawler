import { BaseModel } from './base';

export default class Baranggay extends BaseModel {
  regionId: string;
  provinceId: string;
  municipalityId: string;
  name: string;
  link: string;
}
