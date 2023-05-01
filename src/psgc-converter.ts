import csv from 'csv-parser';
import * as fs from 'fs';
import * as appRootPath from 'app-root-path';
import * as _ from 'lodash';

const extractDataFromPsgcId = (psgcId: string) => {
  const regionId = psgcId.substring(0, 2);
  const provinceId = psgcId.substring(2, 5);
  const municipalityId = psgcId.substring(5, 7);
  const baranggayId = psgcId.substring(psgcId.length - 3);
  return {
    regionId,
    provinceId,
    municipalityId,
    baranggayId
  };
};

const createJsonFile = async (name: string, _data: any) => {
  const data = JSON.stringify(_data);
  await fs.writeFileSync(`${appRootPath}/data/${name}.json`, data);
};

function mapData(data: any) {
  return {
    psgcId: data['10-digit PSGC'],
    name: data['Name'],
    geoLevel: data['Geographic Level'],
    regionId: data['regionId'],
    provinceId: data['provinceId'],
    municipalityId: data['municipalityId'],
    baranggayId: data['baranggayId']
  };
}

(async () => {
  const results: any[] = [];

  fs.createReadStream(`${appRootPath}/data.csv`)
    .pipe(csv())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      // const levels = results.map((r) => r['Geographic Level']);
      // const regions = results.filter((r) => r['Geographic Level'] == 'Reg');
      // const provinces = results.filter((r) => r['Geographic Level'] == 'Prov');
      // const municipalities = results.filter(
      //   (r) => r['Geographic Level'] == 'Mun'
      // );
      // const cities = results.filter((r) => r['Geographic Level'] == 'City');
      // const districts = results.filter((r) => r['Geographic Level'] == 'Dist');
      // const subMun = results.filter((r) => r['Geographic Level'] == 'SubMun');
      // const SGU = results.filter((r) => r['Geographic Level'] == 'SGU');
      // console.log(_.uniq(SGU));

      const newResults = results.map((row: any) => {
        const psgcId = extractDataFromPsgcId(row['10-digit PSGC']);
        return {
          ...row,
          ...psgcId
        };
      });

      const regions = newResults
        .filter((r) => r['Geographic Level'] == 'Reg')
        .map(mapData);
      const provinces = newResults
        .filter((r) => r['Geographic Level'] == 'Prov')
        .map(mapData);
      const municipalities = newResults
        .filter((r) => r['Geographic Level'] == 'Mun')
        .map(mapData);

      const cities = newResults
        .filter((r) => r['Geographic Level'] == 'City')
        .map(mapData);
      const districts = newResults
        .filter((r) => r['Geographic Level'] == 'Dist')
        .map(mapData);

      const subMun = newResults
        .filter((r) => r['Geographic Level'] == 'SubMun')
        .map(mapData);

      const SGU = newResults
        .filter((r) => r['Geographic Level'] == 'SGU')
        .map(mapData);

      const baranggays = newResults
        .filter((r) => r['Geographic Level'] == 'Bgy')
        .map(mapData);

      createJsonFile('psgc-mater-data', newResults).then(() =>
        console.log('psgc done!')
      );
      createJsonFile('regions', regions).then(() =>
        console.log('regions done!')
      );
      createJsonFile('provinces', provinces).then(() =>
        console.log('provinces done!')
      );
      createJsonFile('municipalities', municipalities).then(() =>
        console.log('municipalities done!')
      );
      createJsonFile('cities', cities).then(() => console.log('cities done!'));
      createJsonFile('districts', districts).then(() =>
        console.log('districts done!')
      );
      createJsonFile('sub-municipalities', subMun).then(() =>
        console.log('subMun done!')
      );
      createJsonFile('sgu', SGU).then(() => console.log('sgu done!'));
      createJsonFile('combined-municipalities', [
        ...municipalities,
        ...cities,
        ...districts,
        ...subMun,
        ...SGU
      ]).then(() => console.log('combined-municipalities done!'));
      createJsonFile('baranggays', baranggays).then(() =>
        console.log('baranggays done!')
      );
    });
})();
