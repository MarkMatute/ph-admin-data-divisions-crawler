import {
  searchBaranggays,
  searchMunicipalities,
  searchProvince,
  searchRegion
} from 'ph-geo-admin-divisions';

(async () => {
  const bulacanMunicipalities = await searchMunicipalities();
  bulacanMunicipalities.map((m) => console.log(m.name));
})();
