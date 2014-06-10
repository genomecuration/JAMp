/**
 * TagCloud view makes uses of d3, http://d3js.org/ , and d3 tag cloud created by Jason Davies, http://www.jasondavies.com/word-cloud/.
 * script to add
 * <script src="http://d3js.org/d3.v3.min.js"></script>
 * <script src="lib/d3.layout.cloud.js" ></script>
 */

Ext.define('CV.view.TagCloud',{
  extend:'Ext.container.Container',
  menuTitle:'Tag Cloud',
  alias:'widget.tagcloud',
  mixins:['CV.ux.ThresholdFinder'],
  // id of the div element containing svg tag of tag cloud
  svgId:null,
  // font size of the smallest tag
  baseSize: 10,
  layout:'fit',
  initialMaxSize : 30,
  countField : 'total',
  /**
   * a flag used to tell if the previous max size calculation was aborted since tag cloud was hidden.
   */
  delayedMaxCalc: false,
  // max font size permitted
  maxSize: 30,
  height:'100%',
  width:'100%',
  /*
   * this variable is used to control the categories rendered on the panel. 
   * If the number of categories are more than maxCategories value, then 
   * rendering is prevented and replaced by a mask.
   * 
   */
  maxCategories:Number.MAX_VALUE,
  /*
   * this variable is checked to see if the component should be redrawnn
   */
  redrawn: true,
  /**
   * a flag to specify if the tag cloud needs redrawing
   */
  delayedRefresh : false,
  /**
   * a flag to specify if the tag cloud needs redrawing
   * TODO: change name of this flag.
   */
  filter:false,
  styleHtmlContent : true,
  initComponent:function( ){
    var max;
    this.svgId = this.id+'svg';
    this.clear();
    this.addEvents('itemclicked');
    // this.addListener('show', this.checkChanged, this);
    this.addListener('show', this.checkAndDraw, this);
    this.addListener('activate', this.delayDraw, this);
    this.addListener('afterrender', this.checkAndDraw , this);
    // this.store.addListener( 'load', this.calcMaxSize , this );
    
    // removed since show event is fired on activation of the component
    // this.addListener( 'activate' , this.delayDraw , this)
    this.callParent( arguments );
    

  },
  calcMaxSize:function(){
    var max;
    //calculate max point\
    if ( !this.isHidden() && this.rendered ){
      max = Math.sqrt( (this.getHeight() * this.getWidth() )/this.totalLetters());
      if( max < this.initialMaxSize ){
        this.maxSize = max;
      }
      this.delayedMaxCalc = false;
    }  else {
      this.delayedMaxCalc = true;
    }  
  },
  totalLetters: function(){
    var words = this.transform( this.getAllRecords( this.store ) ),
      totalLetters = 0;
    Ext.each( words , function ( word ) {
      var letters = 0;
      if( word.text ){
        letters = word.text.length;        
      }
      totalLetters += letters;
    });
    return totalLetters;
  },
  averageWordSize:function(){
    var total = this.totalLetters(),
      count = this.store.getCount();
    return total / count;
  },
  /*
   * call checkandDraw function after a certain delay. this is so that the component is rendered first.
   */  
  delayDraw:function(){
    // var task = new Ext.util.DelayedTask( this.checkAndDraw, this );
    // task.delay( 500 );
    this.delayedMaxCalc = true;
    this.checkAndDraw();
  },
  draw:function(){
    this.setRedrawn();
    this.checkAndDraw();
  },
  setRedrawn:function(){
    this.redrawn = true;
  },  
  checkAndDraw:function(){
    // to check if the this or any of the parent components are hidden.
    if ( this.filter && !( this.isHierarchicallyHidden() || this.isHidden() ) ) {
      this.delayedMaxCalc && this.calcMaxCategory();
      this.drawTags();
      this.filter = false;
    }
  },
  clear:function(){
    this.update('<div id="'+ this.svgId +'" ></div>');
  },
  drawTags:function(){
    var words = this.getAllRecords( this.store ), 
      that = this,  
      fill = d3.scale.category20(),
      width = that.getWidth(), 
      height = that.getHeight();
    this.clear();
    var draw = function( w ){
        d3.select( '#'+that.svgId )
        .append("svg")
        .attr("viewBox","0 0 "+ width +" "+ height)
        .attr("height",height)
        .attr("width",width)
        .append("g")
        .attr("transform", "translate("+width/2+','+height/2+")")
        .selectAll("text")
        .data(w)
        .enter()
        .append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "serif")
        .style("fill", function(d, i) { return fill(i); })
        .style('cursor','pointer')
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")";
        })
        .on('click',function(d){ that.fireEvent('itemclicked', d.storeItem); })
        .text(function(d) { return d.text; });
    };

    words = this.transform ( words, true );
    words = this.normalizeSize( words );

    d3.layout.cloud()
    .size([  this.getWidth() , this.getHeight()])
    .words( words )
    .rotate(function() { return 0; })
    .font("serif")
    .fontSize( function(d) { return d.size; } )
    .on("end", draw)
    .start()
    ;
  },
  getAllRecords:function( store ){
    var arr = [];
    store.each(function(rec) {
          arr.push(rec);
    });
    return arr;
  },
  /**
   * transform name and count to text and size respectively and 
   * only includes top N words, where N is the maximum number of words 
   * that can be displayed 
   */
  transform:function( words, topN ){
    var result=[], key , value, word;
    topN = topN || false;
    for( key in words ){
        value = words [ key ];
        // var word = { text: value.get('name') , size: value.get('count') , storeItem: value };
        word = { text: value.get('name') , size: value.get(this.countField) , storeItem: value };
        result.push ( word );
    }
    result = topN? result.splice( 0 , this.maxCategories) : result ;
    return result;
  },
  /**
   * this function will traverse all the element sizes and normalize it
   */
  normalizeSize:function( words ){
    var max = 0, min = Number.MAX_VALUE, that = this,  normalize = function( item ){
      var normsize;
      // log (0) = infinity and log (1) = 0
      if( item != 0 &&  max != 1 ) {
        return Math.round( that.baseSize + (Math.log(item)/Math.log(max))*that.maxSize ); 
      } else {
        if ( !item ){
          return item;
        } else if ( max ){
          return that.maxSize;
        }
        // return item * ;
        // if ( max != min ){
          // normsize = ( item / (max - min) ) * that.maxSize ; 
        // } else {
          // normsize = that.maxSize ;
        // }
        // return normsize < that.baseSize ? that.baseSize : normSize;
      }
    };
    Ext.each( words , function( item ) {
      if( max < item.size ){
        max = item.size;
      }
      if( min > item.size ){
        min = item.size
      }
    });
    Ext.each( words , function( item ) {
        item.size = normalize( item.size , min );
    });
    return words;    
  },
  setThreshold:function( chadopanel ){
    this.calcMaxCategory();
    this.mixins['CV.ux.ThresholdFinder'].setThreshold.apply( this, [chadopanel] );
    // chadopanel.setThreshold( 1 );
  },
  calcMaxCategory:function(){
        var max;
    //calculate max point\
    if ( !this.isHidden() && this.rendered ){
      this.maxCategories = Math.round( Math.sqrt( (this.getHeight() * this.getWidth() )/ ( this.averageWordSize() * ( this.maxSize/2 + this.baseSize/2 ) ) ) );
      this.delayedMaxCalc = false;
    }  else {
      this.delayedMaxCalc = true;
    }
  }
});
