Ext.define("CV.view.feature.NetworkPanel",{
  extend:"Ext.container.Container",
  alias:'widget.networkpanel',
  requires:['CV.view.feature.NetworkList','CV.view.feature.NetworkCanvas','CV.view.feature.TranscriptList'],
  title:'Network',
  layout:'border',
  tooltip:'Shows similar transcripts using a network',
  items:[
    {
      xtype:'networklist'
      
    },{
      xtype:'panel',
      name:'networkviews',
      region:'center',
      layout:{
        type:'accordion'
      },
      items:[
        {
          xtype:'networkcanvas'
        },{
          xtype:'transcriptlist'
        }
      ]
    }
  ]
});