var geometry = 
/* color: #d63000 */
/* shown: false */
ee.Geometry.Polygon(
    [[[-77.89585620965532, 7.442687707812072],
      [-77.89585620965532, -35.39475280299957],
      [-29.556012459655328, -35.39475280299957],
      [-29.556012459655328, 7.442687707812072]]], null, false);

var years = [1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020];

var carbonStock = ee.ImageCollection('projects/mapbiomas-workspace/SOLOS/soil-stock-carbon-v1-3-2')
  .map(function(image){
    return image.set({
      year:ee.Number.parse(image.getString('system:index').split('-').get(3))
    });
  });
  
var lulc = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2');


//------ Geomorfométricas - 90m 
var bands_geomorphometry = [
    'convergence',
    'cti',
    'eastness',
    'northness',
    'pcurv',
    'roughness',
    'slope',
    'spi',
];

//------ Propriedades dos solos - SoilGrids 
var soil_list = [
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/bdod_30m"), 'bdod'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/cec_30m"), 'cec'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/cfvo_30m"), 'cfvo'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/clay_30m"), 'clay'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/nitrogen_30m"), 'nitrogen'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/phh2o_30m"), 'phh2o'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/sand_30m"), 'sand'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/silt_30m"), 'silt'],
  [ee.Image("projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/soc_30m"), 'soc'],
];
var soil_covariates = ee.Image().select();

soil_list = soil_list
  .forEach(function(list){
    var image = list[0];
    var name = list[1];
    
    var images= ee.Image().select()
      .addBands(image.select(0).multiply(1/6))  // 0-5
      .addBands(image.select(1).multiply(2/6))  // 5-15
      .addBands(image.select(2).multiply(3/6)); // 15-30

    image = images
      .reduce('sum')
      .rename(name)
      .int16();
  
    soil_covariates =  soil_covariates.addBands(image);
  });
  

//------ unindo as covariáveis estáticas em uma unica imagem
var static_covariates = ee.Image().select()
  .addBands(soil_covariates)
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/WRB_ALL-SOILS_SOILGRIDS_30M-v4')) //------ SoilGrids: WRB classes and probabilites
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/OT_GEOMORPHOMETRY_30m-v1').select(bands_geomorphometry))
  .addBands(ee.Image("NASA/NASADEM_HGT/001").select('elevation'))
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/ISRIC_SOILGRIDS_30M-v2_gapfill/blackSoilProb_30m'))
  .addBands(ee.Image.pixelLonLat())
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/IPEF_KOPPEN_30M_DUMMY/lv1'))
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/IPEF_KOPPEN_30M_DUMMY/lv2'))
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/IPEF_KOPPEN_30M_DUMMY/lv3'))
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/IBGE_BIOMAS_30M_DUMMY'))
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/IBGE_FITOFISIONOMIAS_30M_DUMMY'))
  .addBands(ee.Image('projects/mapbiomas-workspace/SOLOS/LULC_STABLE_AREAS_30M_DUMMY-v1'));

// ------ COVARIÁVEIS DINÂMICAS ------
var biovariables = ee.ImageCollection('projects/mapbiomas-workspace/SOLOS/BIOVARIABLES_TERRACLIMATE_ANNUALY_30M'); 
var ageLulc = ee.ImageCollection('projects/mapbiomas-workspace/SOLOS/AGE-LULC-STARTING-AT-20-v2-col7');
var ageLulc_list = ageLulc.aggregate_array('index');

var time_since_fire = ee.Image('projects/mapbiomas-workspace/FOGO/MODELAGEM/mbfogo_C01-time_after_the_last_fire-85_2021-v2');
var frequency_fire = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas-fire-collection1-fire-frequency-1').divide(100).byte();

var landsat_ndvi = ee.ImageCollection('projects/mapbiomas-workspace/SOLOS/LANDSAT_NDVI_BY_BYTE');
var avhrr_ndvi = ee.ImageCollection('projects/mapbiomas-workspace/SOLOS/AVHRR_NDVI_BY_BYTE_30m');

var lv0LULC = ee.ImageCollection('projects/mapbiomas-workspace/SOLOS/MAPBIOMAS-LULC-COL7_NATURAL-ANTROPIC_CLASSES_30m');
var lv0LULC_list = lv0LULC.aggregate_array('index');



// Perfil	Latitude	Latitude	Longitude	Longitude	Município
var lists = [
// Perfil	Latitude	Longitude	Município
  [ 'TO-01',	-10.87558333333330000,	-49.60469444444440000,	'Lagoa da Confusão, TO'],
  [ 'TO-02',	-10.76752777777780000,	-49.58708333333330000,	'Lagoa da Confusão, TO'],
  [ 'TO-03',	-10.14477777777780000,	-48.31602777777780000,	'Embrapa Pesca e Aquicultura, Palmas, TO'],
  [ 'TO-04',	-11.53786111111110000,	-46.84450000000000000,	'Dianópolis, TO'],
  [ 'TO-05',	-11.33619444444440000,	-46.75075000000000000,	'Rio da Conceição, TO'],
  [ 'TO-06',	-11.13111111111110000,	-48.19061111111110000,	'Silvanópolis, TO'],
  [ 'TO-07',	-12.59958333333330000,	-46.40555555555560000,	'Aurora do Tocantins, TO'],
  [ 'GO-08',	-13.01647222222220000,	-46.81766666666670000,	'Campos Belos, GO'],
  [ 'GO-09',	-15.32733333333330000,	-49.55686111111110000,	'Rialma, GO'],
  [ 'GO-10',	-16.58869444444440000,	-49.28902777777780000,	'Campus da UFG, Goiânia, GO'],
  [ 'GO-11',	-13.90102777777780000,	-47.38600000000000000,	'Alto Paraíso de Goiás, GO.'],
  [ 'GO-12',	-14.45447222222220000,	-48.45669444444450000,	'Niquelândia, GO'],
  [ 'GO-13',	-14.46863888888890000,	-48.30100000000000000,	'Niquelândia, GO'],
  [ 'GO-14',	-16.43208333333330000,	-49.39847222222220000,	'Embrapa Arroz e Feijão, Brazabrantes, GO'],

];

var features = lists.map(function(list){
  var perfil = list[0];
  var lat = list[1];
  var long = list[2];
  var name = list[3];
  

  return ee.FeatureCollection(years.map(function(year){
    var lulc_year = lulc.select(['classification_'+year],['lulc']);
    var carbonStock_year = carbonStock.filter(ee.Filter.eq('year',year)).mosaic().rename('carbonStock');

var alfa_07 = [
    0.327,
    0.229,
    0.160,
    0.078,
    0.055,
    0.038
  ];

  var year_alternative = year;
  if (year_alternative < 1985 ){
    year_alternative = 1985;
  }
  
  var ndvi_hard = avhrr_ndvi
    .filter(ee.Filter.eq('year',year))//.aside(print)
    .mosaic().blend(landsat_ndvi
    .filter(ee.Filter.eq('year',year))//.aside(print)
    .mosaic());
  
  var container_ndvi = ee.Image().select();
    
  alfa_07.forEach(function(factor){
  
    var year_decay = year - alfa_07.indexOf(factor);
        
    if (year_decay < 1985){
      year_decay = 1985;
    }
    
    var avhrr_ndvi_year = avhrr_ndvi
      .filter(ee.Filter.eq('year',year_decay))//.aside(print)
      .mosaic();
    
    var landsat_ndvi_year = landsat_ndvi
      .filter(ee.Filter.eq('year',year_decay))//.aside(print)
      .mosaic();
  

    var ndvi_year = avhrr_ndvi_year.blend(landsat_ndvi_year)
      .multiply(factor)
      .rename('ndvi_mean'+ year_decay);
          
    container_ndvi = container_ndvi.addBands(ndvi_year);
    
  });

  container_ndvi = container_ndvi
    .reduce('sum')
    .byte()
    .rename('ndvi_decai');


    
  var ageLulc_year = ageLulc_list.iterate(function(current,previous){
    
    var index = ee.String(current);
    
    var image = ageLulc.filter(ee.Filter.eq('index',index)).first();
    
    var image_year = image.select([index.cat('_'+year_alternative)],[index]);
    
    return ee.Image(previous)
      .addBands(image_year);
  },ee.Image().select());

  ageLulc_year = ee.Image(ageLulc_year);


  var lv0LULC_year = lv0LULC_list.iterate(function(current,previous){
    
    var index = ee.String(current);
    
    var image = lv0LULC.filter(ee.Filter.eq('index',index)).first();
    
    var image_year = image.select([index.cat('_'+year_alternative)],[index]);
    
    return ee.Image(previous)
      .addBands(image_year);
  },ee.Image().select());

  lv0LULC_year = ee.Image(lv0LULC_year);
  
    // ----
  var time_since_fire_year = ee.Image(0).blend(time_since_fire.select('classification_'+year_alternative)).rename('Tempo após o fogo');
  var frequency_fire_year = ee.Image(0).blend(frequency_fire.select('fire_frequency_1985_'+year_alternative)).rename('Frequencia de fogo');

  var dinamic_covariates_year = ee.Image().select()
      .addBands(ndvi_hard)
      .addBands(container_ndvi)
      .addBands(ageLulc_year)
      .addBands(time_since_fire_year)
      .addBands(frequency_fire_year)
      .addBands(lv0LULC_year);
  
  var covariates = ee.Image().select()
    .addBands(static_covariates)
    .addBands(dinamic_covariates_year)
    .addBands(ee.Image(year).int16().rename('year'));
  

    
    var image = lulc_year
    .addBands(carbonStock_year)
    .addBands(covariates);
    
    var point = ee.Geometry.Point([long,lat]);

    var reduce = image.reduceRegion({
      reducer:ee.Reducer.first(),
      geometry:point,
      scale:30,
      // crs:,
      // crsTransform:,
      // bestEffort:,
      maxPixels:1e11,
      // tileScale:
    });
    
    return ee.Feature(point)
      .set('Perfil',perfil)
      .set('Longitude',long)
      .set('Latitude',lat)
      .set('Município',name)
      .set('Ano',year)
      .set(reduce);
  }));
});

features = ee.FeatureCollection(features).flatten();

print(features.limit(10));

Map.addLayer(features);

Export.table.toDrive({
  collection:features,
  description:'pontos-lulc-carbonstock-v3',
  folder:'mapbiomas-solos',
  fileNamePrefix:
  'pontos-lulc-carbonstock-3',
  fileFormat:'csv',
  // selectors:,
  // maxVertices:
});