import fs from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer';
import 'reflect-metadata';
import Baranggay from './models/baranggay';
import Municipality from './models/municipality';
import Province from './models/province';
import Region from './models/region';
import { plainToClass } from 'class-transformer';
import appRootPath from 'app-root-path';
import _ from 'lodash';

const timeoutLength = [1000, 1500, 800, 500, 200];
console.warn = () => {
  //
};

class PhilippineDataCrawler {
  private url = 'https://www.philatlas.com/regions.html';
  public regions: Region[] = [];
  public provinces: Province[] = [];
  public municipalities: Municipality[] = [];
  public baranggays: Baranggay[] = [];
  public browser: Browser;
  public page: Page;

  async start() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    this.page.setDefaultNavigationTimeout(120000);

    await this.getRegions();
    await this.getProvinces();
    await this.getMunicipalitiesForProvince();
    await this.getBaranggaysForMunicipality();
    await this.browser.close();
    console.log('Done...');
    process.exit(1);
  }

  async getRegions(): Promise<void> {
    console.log('Getting regions...');

    const storedRegions = await this.readJsonFile('regions');
    if (storedRegions) {
      console.log('Getting stored regions...');
      this.regions = storedRegions;
      return;
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(this.url);

    /**
     * Get Regions
     */
    const regions: any[] = (
      (await page.$$eval('.simList li a', (els) =>
        els.map((el: any) => {
          return {
            name: el.textContent.trim(),
            link: el.href
          };
        })
      )) as any[]
    ).map((r) => plainToClass(Region, { id: Region.generateId(), ...r }));
    await browser.close();
    this.regions = regions;
    await this.createJsonFile('regions', this.regions);
    console.log('Created new regions...');
  }

  private async extractProvinces(region: Region) {
    await this.page.goto(region.link);

    // Select the table rows
    const rows = await this.page.$$('#lguTable tr');

    // Loop through each row and do something with its data
    for (let i = 0; i < rows.length; i++) {
      const typeTd = await rows[i].$$('td');

      const th = await rows[i].$$('th');
      const aTag = await th[0].$$('a');
      if (aTag.length > 0 && typeTd.length > 0) {
        const type = await this.page.evaluate((t) => t.textContent, typeTd[0]);
        const name = await this.page.evaluate((a) => a.textContent, aTag[0]);
        const link = await this.page.evaluate((a) => a.href, aTag[0]);
        if (!_.find(this.provinces, { name }) && type === 'province') {
          console.log(
            `Saving ${name} as province under region ${region.name}.`
          );
          if (name && link) {
            this.provinces.push({
              id: Province.generateId(),
              regionId: region.id,
              name,
              link
            });
          }
        }
      }
    }
    await this.createJsonFile('provinces', this.provinces);
    await new Promise((resolve) =>
      setTimeout(resolve, _.sample(timeoutLength))
    );
  }

  async getProvinces() {
    console.log('Getting Provinces...');
    const storedProvinces = await this.readJsonFile('provinces');
    if (storedProvinces) {
      console.log('Getting stored provinces...');
      this.provinces = storedProvinces;
      return;
    }

    for (const region of this.regions) {
      console.log(`Getting Provinces for regions ${region.name}.`);
      // const extractProvincePromise = this.extractProvinces(region);
      // getProvincesPromises.push(extractProvincePromise);

      if (region.name === 'NCR – National Capital Region') {
        console.log('Setting Metro Manila to province list...');
        this.provinces.push({
          id: Province.generateId(),
          regionId: region.id,
          name: region.name,
          link: region.link
        });
      } else {
        await this.extractProvinces(region);
      }
    }

    // await Promise.all(getProvincesPromises);
  }

  private async extractMunicipalities(province: Province) {
    await this.page.goto(province.link);

    // Select the table rows
    const rows = await this.page.$$('#lguTable tr');

    // Loop through each row and do something with its data
    for (let i = 0; i < rows.length; i++) {
      const th = await rows[i].$$('th');
      const aTag = await th[0].$$('a');

      if (aTag.length > 0) {
        const name = await this.page.evaluate((a) => a.textContent, aTag[0]);
        const link = await this.page.evaluate((a) => a.href, aTag[0]);
        if (name && link && !_.find(this.municipalities, { name })) {
          console.log(`Saving municipality ${name} under ${province.name}.`);
          this.municipalities.push({
            id: Municipality.generateId(),
            regionId: province.regionId,
            provinceId: province.id,
            name,
            link
          });
          await this.createJsonFile('municipalities', this.municipalities);
        }
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, _.sample(timeoutLength))
    );
  }

  async getMunicipalitiesForProvince() {
    console.log('Getting Municipalities...');

    const storedMunicipalities = await this.readJsonFile('municipalities');
    if (storedMunicipalities) {
      console.log('Getting stored municipalities...');
      this.municipalities = storedMunicipalities;
    }

    for (const province of this.provinces) {
      console.log(`Getting Municipalities for regions ${province.name}.`);
      await this.extractMunicipalities(province);
      // const extractMunicipalitiesPromise = this.extractMunicipalities(province);
      // getMunicipalitiesPromises.push(extractMunicipalitiesPromise);
    }

    // await Promise.all(getMunicipalitiesPromises);
  }

  // async getBaranggaysForMunicipality() {}
  private async extractBaranggays(municipality: Municipality) {
    await this.page.goto(municipality.link);

    // Select the table rows
    const rows = await this.page.$$('#lguTable tr');

    // Loop through each row and do something with its data
    for (let i = 0; i < rows.length; i++) {
      const th = await rows[i].$$('th');
      const aTag = await th[0].$$('a');

      if (aTag.length > 0) {
        const name = await this.page.evaluate((a) => a.textContent, aTag[0]);
        const link = await this.page.evaluate((a) => a.href, aTag[0]);
        if (name && link && !_.find(this.baranggays, { name })) {
          console.log(
            `Saving baranggay ${name} under ${municipality.name}. ${
              this.baranggays.length - 0
            }`
          );
          this.baranggays.push({
            id: Baranggay.generateId(),
            regionId: municipality.regionId,
            provinceId: municipality.provinceId,
            municipalityId: municipality.id,
            name,
            link
          });
          await this.createJsonFile('baranggays', this.baranggays);
        }
      }
    }
    await new Promise((resolve) =>
      setTimeout(resolve, _.sample(timeoutLength))
    );
  }

  async getBaranggaysForMunicipality() {
    console.log('Getting Baranggays...');
    const storedBaranggays = await this.readJsonFile('baranggays');
    if (storedBaranggays) {
      console.log('Getting stored baranggays...');
      this.baranggays = storedBaranggays;
    }

    for (const municipality of this.municipalities) {
      console.log(`Getting Baranggays for  ${municipality.name}.`);
      // const extractBaranggaysPromise = this.extractBaranggays(municipality);
      // getBaranggaysPromises.push(extractBaranggaysPromise);
      await this.extractBaranggays(municipality);
    }
    // await Promise.all(getBaranggaysPromises);
  }

  async createJsonFile(name: string, _data: any) {
    const data = JSON.stringify(_data);
    await fs.writeFileSync(`${name}.json`, data);
  }

  async readJsonFile(name: string) {
    try {
      const data = await fs.readFileSync(`${appRootPath}/${name}.json`, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

(async () => {
  const phData = new PhilippineDataCrawler();
  await phData.start();
})();
