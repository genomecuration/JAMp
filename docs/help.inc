<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
    "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8" />
<meta name="generator" content="AsciiDoc 8.6.6" />
<title>Just_Annotate_My_proteins (JAMp)</title>
<style type="text/css">
/* Shared CSS for AsciiDoc xhtml11 and html5 backends */

/* Default font. */
body {
  font-family: Georgia,serif;
}

/* Title font. */
h1, h2, h3, h4, h5, h6,
div.title, caption.title,
thead, p.table.header,
#toctitle,
#author, #revnumber, #revdate, #revremark,
#footer {
  font-family: Arial,Helvetica,sans-serif;
}

body {
  margin: 1em 5% 1em 5%;
}

a {
  color: blue;
  text-decoration: underline;
}
a:visited {
  color: fuchsia;
}

em {
  font-style: italic;
  color: navy;
}

strong {
  font-weight: bold;
  color: #083194;
}

h1, h2, h3, h4, h5, h6 {
  color: #527bbd;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

h1, h2, h3 {
  border-bottom: 2px solid silver;
}
h2 {
  padding-top: 0.5em;
}
h3 {
  float: left;
}
h3 + * {
  clear: left;
}
h5 {
  font-size: 1.0em;
}

div.sectionbody {
  margin-left: 0;
}

hr {
  border: 1px solid silver;
}

p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

ul, ol, li > p {
  margin-top: 0;
}
ul > li     { color: #aaa; }
ul > li > * { color: black; }

pre {
  padding: 0;
  margin: 0;
}

#author {
  color: #527bbd;
  font-weight: bold;
  font-size: 1.1em;
}
#email {
}
#revnumber, #revdate, #revremark {
}

#footer {
  font-size: small;
  border-top: 2px solid silver;
  padding-top: 0.5em;
  margin-top: 4.0em;
}
#footer-text {
  float: left;
  padding-bottom: 0.5em;
}
#footer-badges {
  float: right;
  padding-bottom: 0.5em;
}

#preamble {
  margin-top: 1.5em;
  margin-bottom: 1.5em;
}
div.imageblock, div.exampleblock, div.verseblock,
div.quoteblock, div.literalblock, div.listingblock, div.sidebarblock,
div.admonitionblock {
  margin-top: 1.0em;
  margin-bottom: 1.5em;
}
div.admonitionblock {
  margin-top: 2.0em;
  margin-bottom: 2.0em;
  margin-right: 10%;
  color: #606060;
}

div.content { /* Block element content. */
  padding: 0;
}

/* Block element titles. */
div.title, caption.title {
  color: #527bbd;
  font-weight: bold;
  text-align: left;
  margin-top: 1.0em;
  margin-bottom: 0.5em;
}
div.title + * {
  margin-top: 0;
}

td div.title:first-child {
  margin-top: 0.0em;
}
div.content div.title:first-child {
  margin-top: 0.0em;
}
div.content + div.title {
  margin-top: 0.0em;
}

div.sidebarblock > div.content {
  background: #ffffee;
  border: 1px solid #dddddd;
  border-left: 4px solid #f0f0f0;
  padding: 0.5em;
}

div.listingblock > div.content {
  border: 1px solid #dddddd;
  border-left: 5px solid #f0f0f0;
  background: #f8f8f8;
  padding: 0.5em;
}

div.quoteblock, div.verseblock {
  padding-left: 1.0em;
  margin-left: 1.0em;
  margin-right: 10%;
  border-left: 5px solid #f0f0f0;
  color: #888;
}

div.quoteblock > div.attribution {
  padding-top: 0.5em;
  text-align: right;
}

div.verseblock > pre.content {
  font-family: inherit;
  font-size: inherit;
}
div.verseblock > div.attribution {
  padding-top: 0.75em;
  text-align: left;
}
/* DEPRECATED: Pre version 8.2.7 verse style literal block. */
div.verseblock + div.attribution {
  text-align: left;
}

div.admonitionblock .icon {
  vertical-align: top;
  font-size: 1.1em;
  font-weight: bold;
  text-decoration: underline;
  color: #527bbd;
  padding-right: 0.5em;
}
div.admonitionblock td.content {
  padding-left: 0.5em;
  border-left: 3px solid #dddddd;
}

div.exampleblock > div.content {
  border-left: 3px solid #dddddd;
  padding-left: 0.5em;
}

div.imageblock div.content { padding-left: 0; }
span.image img { border-style: none; }
a.image:visited { color: white; }

dl {
  margin-top: 0.8em;
  margin-bottom: 0.8em;
}
dt {
  margin-top: 0.5em;
  margin-bottom: 0;
  font-style: normal;
  color: navy;
}
dd > *:first-child {
  margin-top: 0.1em;
}

ul, ol {
    list-style-position: outside;
}
ol.arabic {
  list-style-type: decimal;
}
ol.loweralpha {
  list-style-type: lower-alpha;
}
ol.upperalpha {
  list-style-type: upper-alpha;
}
ol.lowerroman {
  list-style-type: lower-roman;
}
ol.upperroman {
  list-style-type: upper-roman;
}

div.compact ul, div.compact ol,
div.compact p, div.compact p,
div.compact div, div.compact div {
  margin-top: 0.1em;
  margin-bottom: 0.1em;
}

tfoot {
  font-weight: bold;
}
td > div.verse {
  white-space: pre;
}

div.hdlist {
  margin-top: 0.8em;
  margin-bottom: 0.8em;
}
div.hdlist tr {
  padding-bottom: 15px;
}
dt.hdlist1.strong, td.hdlist1.strong {
  font-weight: bold;
}
td.hdlist1 {
  vertical-align: top;
  font-style: normal;
  padding-right: 0.8em;
  color: navy;
}
td.hdlist2 {
  vertical-align: top;
}
div.hdlist.compact tr {
  margin: 0;
  padding-bottom: 0;
}

.comment {
  background: yellow;
}

.footnote, .footnoteref {
  font-size: 0.8em;
}

span.footnote, span.footnoteref {
  vertical-align: super;
}

#footnotes {
  margin: 20px 0 20px 0;
  padding: 7px 0 0 0;
}

#footnotes div.footnote {
  margin: 0 0 5px 0;
}

#footnotes hr {
  border: none;
  border-top: 1px solid silver;
  height: 1px;
  text-align: left;
  margin-left: 0;
  width: 20%;
  min-width: 100px;
}

div.colist td {
  padding-right: 0.5em;
  padding-bottom: 0.3em;
  vertical-align: top;
}
div.colist td img {
  margin-top: 0.3em;
}

@media print {
  #footer-badges { display: none; }
}

#toc {
  margin-bottom: 2.5em;
}

#toctitle {
  color: #527bbd;
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 1.0em;
  margin-bottom: 0.1em;
}

div.toclevel1, div.toclevel2, div.toclevel3, div.toclevel4 {
  margin-top: 0;
  margin-bottom: 0;
}
div.toclevel2 {
  margin-left: 2em;
  font-size: 0.9em;
}
div.toclevel3 {
  margin-left: 4em;
  font-size: 0.9em;
}
div.toclevel4 {
  margin-left: 6em;
  font-size: 0.9em;
}

span.aqua { color: aqua; }
span.black { color: black; }
span.blue { color: blue; }
span.fuchsia { color: fuchsia; }
span.gray { color: gray; }
span.green { color: green; }
span.lime { color: lime; }
span.maroon { color: maroon; }
span.navy { color: navy; }
span.olive { color: olive; }
span.purple { color: purple; }
span.red { color: red; }
span.silver { color: silver; }
span.teal { color: teal; }
span.white { color: white; }
span.yellow { color: yellow; }

span.aqua-background { background: aqua; }
span.black-background { background: black; }
span.blue-background { background: blue; }
span.fuchsia-background { background: fuchsia; }
span.gray-background { background: gray; }
span.green-background { background: green; }
span.lime-background { background: lime; }
span.maroon-background { background: maroon; }
span.navy-background { background: navy; }
span.olive-background { background: olive; }
span.purple-background { background: purple; }
span.red-background { background: red; }
span.silver-background { background: silver; }
span.teal-background { background: teal; }
span.white-background { background: white; }
span.yellow-background { background: yellow; }

span.big { font-size: 2em; }
span.small { font-size: 0.6em; }

span.underline { text-decoration: underline; }
span.overline { text-decoration: overline; }
span.line-through { text-decoration: line-through; }


/*
 * xhtml11 specific
 *
 * */

tt {
  font-family: monospace;
  font-size: inherit;
  color: navy;
}

div.tableblock {
  margin-top: 1.0em;
  margin-bottom: 1.5em;
}
div.tableblock > table {
  border: 3px solid #527bbd;
}
thead, p.table.header {
  font-weight: bold;
  color: #527bbd;
}
p.table {
  margin-top: 0;
}
/* Because the table frame attribute is overriden by CSS in most browsers. */
div.tableblock > table[frame="void"] {
  border-style: none;
}
div.tableblock > table[frame="hsides"] {
  border-left-style: none;
  border-right-style: none;
}
div.tableblock > table[frame="vsides"] {
  border-top-style: none;
  border-bottom-style: none;
}


/*
 * html5 specific
 *
 * */

.monospaced {
  font-family: monospace;
  font-size: inherit;
  color: navy;
}

table.tableblock {
  margin-top: 1.0em;
  margin-bottom: 1.5em;
}
thead, p.tableblock.header {
  font-weight: bold;
  color: #527bbd;
}
p.tableblock {
  margin-top: 0;
}
table.tableblock {
  border-width: 3px;
  border-spacing: 0px;
  border-style: solid;
  border-color: #527bbd;
  border-collapse: collapse;
}
th.tableblock, td.tableblock {
  border-width: 1px;
  padding: 4px;
  border-style: solid;
  border-color: #527bbd;
}

table.tableblock.frame-topbot {
  border-left-style: hidden;
  border-right-style: hidden;
}
table.tableblock.frame-sides {
  border-top-style: hidden;
  border-bottom-style: hidden;
}
table.tableblock.frame-none {
  border-style: hidden;
}

th.tableblock.halign-left, td.tableblock.halign-left {
  text-align: left;
}
th.tableblock.halign-center, td.tableblock.halign-center {
  text-align: center;
}
th.tableblock.halign-right, td.tableblock.halign-right {
  text-align: right;
}

th.tableblock.valign-top, td.tableblock.valign-top {
  vertical-align: top;
}
th.tableblock.valign-middle, td.tableblock.valign-middle {
  vertical-align: middle;
}
th.tableblock.valign-bottom, td.tableblock.valign-bottom {
  vertical-align: bottom;
}


/*
 * manpage specific
 *
 * */

body.manpage h1 {
  padding-top: 0.5em;
  padding-bottom: 0.5em;
  border-top: 2px solid silver;
  border-bottom: 2px solid silver;
}
body.manpage h2 {
  border-style: none;
}
body.manpage div.sectionbody {
  margin-left: 3em;
}

@media print {
  body.manpage div#toc { display: none; }
}
</style>
<script type="text/javascript">
/*<![CDATA[*/
var asciidoc = {  // Namespace.

/////////////////////////////////////////////////////////////////////
// Table Of Contents generator
/////////////////////////////////////////////////////////////////////

/* Author: Mihai Bazon, September 2002
 * http://students.infoiasi.ro/~mishoo
 *
 * Table Of Content generator
 * Version: 0.4
 *
 * Feel free to use this script under the terms of the GNU General Public
 * License, as long as you do not remove or alter this notice.
 */

 /* modified by Troy D. Hanson, September 2006. License: GPL */
 /* modified by Stuart Rackham, 2006, 2009. License: GPL */

// toclevels = 1..4.
toc: function (toclevels) {

  function getText(el) {
    var text = "";
    for (var i = el.firstChild; i != null; i = i.nextSibling) {
      if (i.nodeType == 3 /* Node.TEXT_NODE */) // IE doesn't speak constants.
        text += i.data;
      else if (i.firstChild != null)
        text += getText(i);
    }
    return text;
  }

  function TocEntry(el, text, toclevel) {
    this.element = el;
    this.text = text;
    this.toclevel = toclevel;
  }

  function tocEntries(el, toclevels) {
    var result = new Array;
    var re = new RegExp('[hH]([2-'+(toclevels+1)+'])');
    // Function that scans the DOM tree for header elements (the DOM2
    // nodeIterator API would be a better technique but not supported by all
    // browsers).
    var iterate = function (el) {
      for (var i = el.firstChild; i != null; i = i.nextSibling) {
        if (i.nodeType == 1 /* Node.ELEMENT_NODE */) {
          var mo = re.exec(i.tagName);
          if (mo && (i.getAttribute("class") || i.getAttribute("className")) != "float") {
            result[result.length] = new TocEntry(i, getText(i), mo[1]-1);
          }
          iterate(i);
        }
      }
    }
    iterate(el);
    return result;
  }

  var toc = document.getElementById("toc");
  if (!toc) {
    return;
  }

  // Delete existing TOC entries in case we're reloading the TOC.
  var tocEntriesToRemove = [];
  var i;
  for (i = 0; i < toc.childNodes.length; i++) {
    var entry = toc.childNodes[i];
    if (entry.nodeName == 'div'
     && entry.getAttribute("class")
     && entry.getAttribute("class").match(/^toclevel/))
      tocEntriesToRemove.push(entry);
  }
  for (i = 0; i < tocEntriesToRemove.length; i++) {
    toc.removeChild(tocEntriesToRemove[i]);
  }

  // Rebuild TOC entries.
  var entries = tocEntries(document.getElementById("content"), toclevels);
  for (var i = 0; i < entries.length; ++i) {
    var entry = entries[i];
    if (entry.element.id == "")
      entry.element.id = "_toc_" + i;
    var a = document.createElement("a");
    a.href = "#" + entry.element.id;
    a.appendChild(document.createTextNode(entry.text));
    var div = document.createElement("div");
    div.appendChild(a);
    div.className = "toclevel" + entry.toclevel;
    toc.appendChild(div);
  }
  if (entries.length == 0)
    toc.parentNode.removeChild(toc);
},


/////////////////////////////////////////////////////////////////////
// Footnotes generator
/////////////////////////////////////////////////////////////////////

/* Based on footnote generation code from:
 * http://www.brandspankingnew.net/archive/2005/07/format_footnote.html
 */

footnotes: function () {
  // Delete existing footnote entries in case we're reloading the footnodes.
  var i;
  var noteholder = document.getElementById("footnotes");
  if (!noteholder) {
    return;
  }
  var entriesToRemove = [];
  for (i = 0; i < noteholder.childNodes.length; i++) {
    var entry = noteholder.childNodes[i];
    if (entry.nodeName == 'div' && entry.getAttribute("class") == "footnote")
      entriesToRemove.push(entry);
  }
  for (i = 0; i < entriesToRemove.length; i++) {
    noteholder.removeChild(entriesToRemove[i]);
  }

  // Rebuild footnote entries.
  var cont = document.getElementById("content");
  var spans = cont.getElementsByTagName("span");
  var refs = {};
  var n = 0;
  for (i=0; i<spans.length; i++) {
    if (spans[i].className == "footnote") {
      n++;
      var note = spans[i].getAttribute("data-note");
      if (!note) {
        // Use [\s\S] in place of . so multi-line matches work.
        // Because JavaScript has no s (dotall) regex flag.
        note = spans[i].innerHTML.match(/\s*\[([\s\S]*)]\s*/)[1];
        spans[i].innerHTML =
          "[<a id='_footnoteref_" + n + "' href='#_footnote_" + n +
          "' title='View footnote' class='footnote'>" + n + "</a>]";
        spans[i].setAttribute("data-note", note);
      }
      noteholder.innerHTML +=
        "<div class='footnote' id='_footnote_" + n + "'>" +
        "<a href='#_footnoteref_" + n + "' title='Return to text'>" +
        n + "</a>. " + note + "</div>";
      var id =spans[i].getAttribute("id");
      if (id != null) refs["#"+id] = n;
    }
  }
  if (n == 0)
    noteholder.parentNode.removeChild(noteholder);
  else {
    // Process footnoterefs.
    for (i=0; i<spans.length; i++) {
      if (spans[i].className == "footnoteref") {
        var href = spans[i].getElementsByTagName("a")[0].getAttribute("href");
        href = href.match(/#.*/)[0];  // Because IE return full URL.
        n = refs[href];
        spans[i].innerHTML =
          "[<a href='#_footnote_" + n +
          "' title='View footnote' class='footnote'>" + n + "</a>]";
      }
    }
  }
},

install: function(toclevels) {
  var timerId;

  function reinstall() {
    asciidoc.footnotes();
    if (toclevels) {
      asciidoc.toc(toclevels);
    }
  }

  function reinstallAndRemoveTimer() {
    clearInterval(timerId);
    reinstall();
  }

  timerId = setInterval(reinstall, 500);
  if (document.addEventListener)
    document.addEventListener("DOMContentLoaded", reinstallAndRemoveTimer, false);
  else
    window.onload = reinstallAndRemoveTimer;
}

}
asciidoc.install();
/*]]>*/
</script>
</head>
<body class="article">
<div id="header">
<h1>Just_Annotate_My_proteins (JAMp)</h1>
<span id="author">Alexie Papanicolaou</span><br />
<span id="email"><tt>&lt;<a href="mailto:alexie@butterflybase.org">alexie@butterflybase.org</a>&gt;</tt></span><br />
<span id="revdate">25 November 2013</span>
</div>
<div id="content">
<div class="sect1">
<h2 id="_introduction">Introduction</h2>
<div class="sectionbody">
<div class="paragraph"><p>Whether working on a model species for biomedical, economical or evolutionary research, next-generation sequencing has enabled biologists to rapidly generate a reference sequence for downstream applications and hypotheses generation. With the exception of a limited number of species, functional annotation is conducted by <em>in-silico</em> experiments based on sequence similarity. JAMp is a platform that allows biologists to reclaim the analysis of transcript reconstruction experiments by providing an automated, user-friendly overview of these <em>in-silico</em> experiments.</p></div>
</div>
</div>
<div class="sect1">
<h2 id="_how_does_it_look">How does it look?</h2>
<div class="sectionbody">
<div class="paragraph"><p>A core element of JAMp is its rich Graphical User Interface (GUI). Such interfaces are important not only because they allow biologists to explore their data without using the command line and spreadsheets but because it provide a vastly more efficient human-machine interface (i.e. yes, many expert bioinformaticians also use GUIs to conduct analyses!). See <a href="http://annotation.insectacentral.org/demo">this demo</a>.</p></div>
</div>
</div>
<div class="sect1">
<h2 id="_how_does_it_work">How does it work</h2>
<div class="sectionbody">
<div class="paragraph"><p>Like most bioinformatic software, JAMp and its dependencies must first be installed before end-users can use it. The process is by itself simple but Linux system administration is often an onerous task so feel free to ask our <a href="mailto:jamps-users@lists.sourceforge.net">user mailing list</a> if you require help.</p></div>
<div class="ulist"><ul>
<li>
<p>
First, administrators install the software, including the annotation database and a website that drives the GUI. This needs to occur only once and they are very simple
</p>
<div class="ulist"><ul>
<li>
<p>
Administrators also have to install the HHblits software that we use for conducting the Hidden Markov searches. As a High Performance Computing (HPC) environment is required, your HPC administrators might be able to help (no compilation is required so that too ought to be simple - and we may be able to help)
</p>
</li>
</ul></div>
</li>
<li>
<p>
Second, for every reference sequence (e.g. a Trinity RNA-Seq transcript assembly), users with some command of the Linux command line) conduct the <em>in-silico</em> experiment (currently HHblits is supported). A perl script then stores the output and relevant metadata (e.g. name of species) into the JAMp database
</p>
</li>
<li>
<p>
The users (and the anyone with access to the website, such as paper reviewers and readers) use their browser to explore the functional annotations using a powerful yet intuitive GUI.
</p>
</li>
</ul></div>
<div class="paragraph"><p>Too easy!</p></div>
</div>
</div>
<div class="sect1">
<h2 id="_controlled_vocabularies">Controlled Vocabularies</h2>
<div class="sectionbody">
<div class="paragraph"><p>We use a number of control vocabularies (and ontologies) to organize the way we present functional annotation knowledge. There is no limit to what kind of vocabularies JAMp can support but we are currently using the <a href="http://www.geneontology.org">Gene Ontology</a>. <a href="http://www.chem.qmul.ac.uk/iubmb/enzyme/">Enzyme Classification</a> (currently primarily for bacteria), <a href="http://eggnog.embl.de">EggNOG</a> and <a href="http:www.genome.jp/kegg/">Kyoto Encyclopedia of Genes and Genomes</a> (KEGG).</p></div>
<div class="admonitionblock">
<table><tr>
<td class="icon">
<img src="css/images/asciidoc/warning.png" alt="Warning" />
</td>
<td class="content">Users must understand a bit about the process of electronic inference. We have an unknown protein and we wish to infer what it may do. We don&#8217;t have any functional data so we look for (using a software, i.e. <em>'in-silico</em>'), a <em>similar</em> known protein that has experimental evidence. We then infer that our protein has the same function. JAMP ensures that only known proteins with real experimental evidence are used in this inference, in other words, we are being careful not to do a double inference: assigning a function to our unknown protein because it is similar to another protein that has no experimental data but is similar to one that does. In theory this reduces the sensitivity of our search but the way we populate the database and identify our similar known proteins is not by BLAST but by a Hidden Markov search which is far more sensitive (see below).</td>
</tr></table>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_high_performance_computing">High-Performance Computing</h2>
<div class="sectionbody">
<div class="admonitionblock">
<table><tr>
<td class="icon">
<img src="css/images/asciidoc/important.png" alt="Important" />
</td>
<td class="content">Overall, annotating with JAMp is significantly faster than annotating with the traditional BLASTx approach. This is especially true in the NGS era. In the past, transcriptomic projects were composed of a few hundred reliable genes and therefore tasks based on BLAST (e.g. BLAST2GO), were commonplace. In the RNAseq era, it is commonplace that dozens of thousands of high quality transcripts are reconstructed. Further, full genome sequencing (and gene model reconstruction) is now available for hundrends of species. Further, the so called non-model species are often significantly divergent from Arabidopsis, Fruitfly, Human/Mouse, Yeast etc that a model-based, recursive yet time-consuming searches are required (such PSI-BLAST or an HMM search).</td>
</tr></table>
</div>
<div class="paragraph"><p>How dow we address this problem? First, JAMp uses <a href="http://www.nature.com/nmeth/journal/v9/n2/full/nmeth.1818.html">HHblits</a>, a HM model-based search software that searches your protein against Uniprot, builds an alignment and a model and then searches again. Importantly, thanks to the <a href="http://pubshare.genzentrum.lmu.de/scientific_computing/software/ffindex/">ffindex</a> software, we offer an MPI approach to running these <em>in-silico</em> experiments. Sadly, because of the cost of creating a reliable infrastructure, we currently cannot offer this is as a service to public but a number of institutes host bioinformatics enabled HPC environments. Some, such as <a href="http://diagcomputing.org/">DIAG</a>, the Data Intensive Academic Grid, are freely available to any life-science researcher. We are interested in being to deploy this on an Amazon cloud (I guess that a single analysis would be about $300) but we do not currently have the manpower to accomplish that.</p></div>
</div>
</div>
<div class="sect1">
<h2 id="_what_uses_cases_does_jamp_accomodate">What uses cases does JAMp accomodate?</h2>
<div class="sectionbody">
<div class="paragraph"><p>Basically, <em>Just_Annotate_My_proteins</em> does exactly what it reads on the tin! You give it a protein FASTA file and it annotates it with functional terms. The terms are derived from the <a href="http://www.ncbi.nlm.nih.gov/pubmed">literature</a> and the <a href="http://en.wikipedia.org/wiki/Biocurator">biocuration</a> teams working on linking known proteins with these terms. The use cases therefore are not restricted but we routinely use it for annotating:</p></div>
<div class="ulist"><ul>
<li>
<p>
Transcriptome experiments that produce a reference sequence (an assembly)
</p>
</li>
</ul></div>
</div>
</div>
<div class="sect1">
<h2 id="_obtaining_jamg">Obtaining JAMg</h2>
<div class="sectionbody">
<div class="paragraph"><p>Currently only distributed through the author.</p></div>
</div>
</div>
<div class="sect1">
<h2 id="_running_jamg">Running JAMg</h2>
<div class="sectionbody">
<div class="paragraph"><p>See README in distribution.</p></div>
</div>
</div>
<div class="sect1">
<h2 id="_authors_amp_license">Authors &amp; license</h2>
<div class="sectionbody">
<div class="paragraph"><p>Copyright 2012-2014 the <a href="http://csiro.au">Commonwealth Scientific and Industrial Research Organization</a>.</p></div>
<div class="literalblock">
<div class="content">
<pre><tt>Temi Varghese and Alexie Papanicolaou</tt></pre>
</div></div>
<div class="literalblock">
<div class="content">
<pre><tt>CSIRO Ecosystem Sciences
temi.varghese@csiro.au
alexie.papanicolaou@csiro.au</tt></pre>
</div></div>
<div class="literalblock">
<div class="content">
<pre><tt>Copyright CSIRO 2013-2014.
This software is released under the Mozilla Public License v.2. You can find the terms and conditions at http://www.mozilla.org/MPL/2.0.
It is provided "as is" without warranty of any kind.</tt></pre>
</div></div>
</div>
</div>
</div>
<div id="footnotes"><hr /></div>
<div id="footer">
<div id="footer-text">
Last updated 2013-12-23 15:50:25 EST
</div>
</div>
</body>
</html>
