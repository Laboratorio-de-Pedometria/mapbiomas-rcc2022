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
          // Perfil	Latitude	Longitude	Município
            [ 'TO-01',	-10,87558333333330000,	-49,60469444444440000,	'Lagoa da Confusão, TO'],
            [ 'TO-02',	-10,76752777777780000,	-49,58708333333330000,	'Lagoa da Confusão, TO'],
            [ 'TO-03',	-10,14477777777780000,	-48,31602777777780000,	'Embrapa Pesca e Aquicultura, Palmas, TO'],
            [ 'TO-04',	-11,53786111111110000,	-46,84450000000000000,	'Dianópolis, TO'],
            [ 'TO-05',	-11,33619444444440000,	-46,75075000000000000,	'Rio da Conceição, TO'],
            [ 'TO-06',	-11,13111111111110000,	-48,19061111111110000,	'Silvanópolis, TO'],
            [ 'TO-07',	-12,59958333333330000,	-46,40555555555560000,	'Aurora do Tocantins, TO'],
            [ 'GO-08',	-13,01647222222220000,	-46,81766666666670000,	'Campos Belos, GO'],
            [ 'GO-09',	-15,32733333333330000,	-49,55686111111110000,	'Rialma, GO'],
            [ 'GO-10',	-16,58869444444440000,	-49,28902777777780000,	'Campus da UFG, Goiânia, GO'],
            [ 'GO-11',	-13,90102777777780000,	-47,38600000000000000,	'Alto Paraíso de Goiás, GO.'],
            [ 'GO-12',	-14,45447222222220000,	-48,45669444444450000,	'Niquelândia, GO'],
            [ 'GO-13',	-14,46863888888890000,	-48,30100000000000000,	'Niquelândia, GO'],
            [ 'GO-14',	-16,43208333333330000,	-49,39847222222220000,	'Embrapa Arroz e Feijão, Brazabrantes, GO'],
          
          ];
          
          var features = lists.map(function(list){
            var perfil = list[0];
            var lat = list[1];
            var long = list[2];
            var name = list[3];
            
          
            return ee.FeatureCollection(years.map(function(year){
              var lulc_year = lulc.select(['classification_'+year],['lulc']);
              var carbonStock_year = carbonStock.filter(ee.Filter.eq('year',year)).mosaic().rename('carbonStock');
              
              var image = lulc_year.addBands(carbonStock_year);
              
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
          
          print(features);
          
          Map.addLayer(features);
          
          Export.table.toDrive({
            collection:features,
            description:'pontos-lulc-carbonstock-v2',
            folder:'mapbiomas-solos',
            fileNamePrefix:
            'pontos-lulc-carbonstock-v2',
            fileFormat:'csv',
            // selectors:,
            // maxVertices:
          });