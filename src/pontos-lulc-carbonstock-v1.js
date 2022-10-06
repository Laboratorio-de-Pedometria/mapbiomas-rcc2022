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
          
          
          // Perfil	Latitude	Latitude	Longitude	Longitude	Município
          var lists = [
          // perfil,    lat_1               lat_2     long_1              long_2  name
            ['TO-01',  "10° 52' 32,1'' S",	-10.88,	 "49° 36' 16,9'' W",	-49.60,	'Lagoa da Confusão, TO'],
            ['TO-02',  "10° 46' 03,1'' S",	-10.77,	 "49° 35' 13,5'' W",	-49.59,	'Lagoa da Confusão, TO'],
            ['TO-03',  "10° 08' 41,2'' S",	-10.14,	 "48° 18' 57,7'' W",	-48.32,	'Embrapa Pesca e Aquicultura, Palmas, TO'],
            ['TO-04',  "11° 32' 16,3'' S",	-11.54,	 "46° 50' 40,2'' W",	-46.84,	'Dianópolis, TO'],
            ['TO-05',  "11° 20' 10,3'' S",	-11.34,	 "46° 45' 02,7'' W",	-48.75,	'Rio da Conceição, TO'],
            ['TO-06',  "11° 07' 52,0'' S",	-11.13,	 "48° 11' 26,2'' W",	-48.19,	'Silvanópolis, TO'],
            ['TO-07',  "12° 35' 58,5'' S",	-12.60,	 "46° 24' 20,0'' W",	-46.41,	'Aurora do Tocantins, TO'],
            ['GO-08',  "13° 00' 59,3'' S",	-13.02,	 "46° 49' 03,6'' W",	-46.82,	'Campos Belos, GO'],
            ['GO-09',  "15° 19' 38,4'' S",	-15.33,	 "49° 33' 24,7'' W",	-49.56,	'Rialma, GO'],
            ['GO-10',  "16° 35' 19,3'' S",	-16.59,	 "49° 17' 20,5'' W",	-49.29,	'Campus da UFG, Goiânia, GO'],
            ['GO-11',  "13° 54' 03,7'' S",	-13.90,	 "47° 23' 09,6'' W",	-47.39,	'Alto Paraíso de Goiás, GO'],
            ['GO-12',  "14° 27' 16,1'' S",	-14.45,	 "48° 27' 24,1'' W",	-48.46,	'Niquelândia, GO'],
            ['GO-13',  "14° 28' 07,1'' S",	-14.47,	 "48° 18' 03,6'' W",	-48.30,	'Niquelândia, GO'],
            ['GO-14',  "16° 25' 55,5'' S",	-16.43,	 "49° 23' 54,5'' W",	-49.40,	'Embrapa Arroz e Feijão, Brazabrantes, GO'],
          ];
          
          var features = lists.map(function(list){
            var perfil = list[0];
            var lat_1 = list[1];
            var lat_2 = list[2];
            var long_1 = list[3];
            var long_2 = list[4];
            var name = list[5];
            
          
            return ee.FeatureCollection(years.map(function(year){
              var lulc_year = lulc.select(['classification_'+year],['lulc']);
              var carbonStock_year = carbonStock.filter(ee.Filter.eq('year',year)).mosaic().rename('carbonStock');
              
              var image = lulc_year.addBands(carbonStock_year);
              
              var point = ee.Geometry.Point([long_2,lat_2]);
          
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
                .set('perfil',perfil)
                .set('lat_1',lat_1)
                .set('lat_2',lat_2)
                .set('long_1',long_1)
                .set('long_2',long_2)
                .set('name',name)
                .set('year',year)
                .set(reduce);
            }));
          });
          
          features = ee.FeatureCollection(features).flatten();
          
          print(features);
          
          Map.addLayer(features);
          
          Export.table.toDrive({
            collection:features,
            description:'pontos-lulc-carbonstock-v1',
            folder:'mapbiomas-solos',
            fileNamePrefix:'pontos-lulc-carbonstock-v1',
            fileFormat:'csv',
            // selectors:,
            // maxVertices:
          })
          
          