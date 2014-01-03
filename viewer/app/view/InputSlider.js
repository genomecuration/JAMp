Ext.define('CV.view.InputSlider', {
  extend:'Ext.slider.Single',
  // isFormField: true,
  /**
   * the number field containing
   */ 
  sliderField: null,
  initComponent: function() {
    // this.originalValue = this.value;
    // this.width += 80;
    this.callParent( arguments );
  }
  ,
  onRender: function(){
    this.callParent( arguments );
    Ext.DomHelper.insertAfter(this.el,{
        tag: 'div',
        id: this.id +'_slidertextdiv',
        style: 'position: relative; float:right;width:60px;height:20px;margin-left:5px;margin-right:90px'
    });

    this.sliderField = new Ext.form.field.Text({
        // renderTo:this.inputEl,
        renderTo: this.id +'_slidertextdiv',
        // applyTo:this.id +'_slidertextdiv',
        id: this.id +'_slidertext',
        name: this.name +'_slidertext',
        value: this.value,
        enableKeyEvents:true,
        width:60,
 //       minValue:this.minValue,
   //     maxValue:this.maxValue ,

        scope:this,
        listeners: {
            change : function() {
                this.adjustValue( this );
            },
            keyup:function(text , e){
              e.stopPropagation();
              // this.adjustValue( this );
            },
            scope:this
        }
    });
  },
  adjustValue : function(){
    // if(this.sliderField.getValue()==""){
         // this.setValue(this.sliderField.minValue);
    // } else {
        Ext.getDom( this.id +'_slidertext' ).value = v;
        this.setValue(this.sliderField.getValue());
    // }
    this.sliderField.clearInvalid();
  },
  setValue: function(v) {
    this.callParent ( arguments );
    // v = parseInt(v);
    
    if(this.rendered){
      // if(v<=0){
        // Ext.getDom(this.id +'_slidertext').value=0;
      // } else {
        Ext.getDom( this.id +'_slidertext' ).value = v;
//        this.sliderField.value = this.getValue();
      // }
      
    }
  }
  // // reset: function() {
    // // this.setValue(this.originalValue);
    // // this.clearInvalid();
  // // },
  // // getName: function() {
    // // return this.name;
  // // },
  // // validate: function() {
    // // return true;
  // // },
  // setMinValue : function(minValue){
    // this.callParent( arguments );
    // // this.minValue = minValue;
    // this.sliderField.setMinValue( minValue ) ;
    // return minValue;
  // },
  // setMaxValue : function(maxValue){
    // this.callParent( arguments );
    // // this.maxValue = maxValue;
    // this.sliderField.setMaxValue( maxValue );
    // return maxValue
  // }
  // // ,
  // // markInvalid: Ext.emptyFn,
  // // clearInvalid: Ext.emptyFn
});