Ext.define ( 'Ext.data.SpeciesGrid' , {
      extend:'Ext.data.Store',
      requires:['CV.config.ChadoViewer'],
      autoLoad: true,
      fields:[
        "library_id",
        "library_name",
        "genus",
        "species",
        "name",
        "timeaccessioned",
        "timelastmodified",
        "term",
        "vocabulary",
        "publication_title",
        "publication_type"
      ],
      proxy:{
        type:'ajax',
        url : CV.config.ChadoViewer.self.baseUrl,
        reader:{
          type:'json',
          root:'root',
          successProperty:false,
          totalProperty: false            
        }
      }
    });