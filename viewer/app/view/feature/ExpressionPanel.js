Ext.define("CV.view.feature.ExpressionPanel",{
  extend:"Ext.container.Container",
  alias:'widget.expressionpanel',
  requires:['CV.view.feature.ExpressionList','CV.view.feature.ExpressionImage'],
  title:'Expression figures',
  layout:'border',
  tooltip:'Expression',
  items:[
    {
      xtype:'expressionlist',
      autoScroll: true
    },{
      xtype:'expressionimage',
      autoScroll: true
    }
  ]
});