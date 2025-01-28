$(document).ready(function(){
    const characteristics = {
        // EI_NAT
        a:{clima:"RCP 2.6",population:"Low",economy:"Ecological awareness – Urban densification",value:"mainly intrinsic",protected:"30% under IUCN Ia or IV"},
        // EI_CUL
        b:{clima:"RCP 2.6",population:"Reference",economy:"Ecological awareness – Central",value:"mainly relational",protected:"25% under IUCN categories V or VI"}, 
        // EI_SOC
        c:{clima:"RCP 4.5",population:"Reference",economy:"Combined technological acceleration and Ecological awareness – Urban densification",value:"mainly instrumental",protected:"25% under IUCN categories II or IV"}, 
        // BAU
        d:{clima:"RCP 4.5",population:"Reference",economy:"Reference - Central",value:"mainly instrumental",protected:"At current level, under II and IV"}, 
        // GR_EX
        e:{clima:"RCP 8.5",population:"High",economy:"Reference - Peri-Urbanisation",value:"mainly instrumental",protected:"At current level, without strict management"}, 

    }
	for (const key in characteristics) {
		if (characteristics.hasOwnProperty(key)) {
			const c = characteristics[key];
            let myString=`<li title="Climate scenario"><img src="img/icons/clima.png"><span><span class="item"><a href="https://www.nccs.admin.ch/nccs/en/home/climate-change-and-impacts/swiss-climate-change-scenarios/ch2018-web-atlas.html" target="_blank">Climate scenario:</a></span><span class="value">${c.clima}</span></span></li>
            <li title="Population scenario"><img src="img/icons/population.png"><span><span class="item"><a href="https://www.bfs.admin.ch/bfs/en/home/statistics/population/population-projections/national-projections.html">Population scenario:</a></span><span class="value">${c.population}</span></span></li>
            <li title="Economic scenario"><img src="img/icons/economy.png"><span><span class="item"><a href="https://www.bfs.admin.ch/bfs/en/home/statistics/population/population-projections/national-projections.html">Economic scenario:</a></span><span class="value">${c.economy}</span></span></li>
            <li title="Value perspective on nature"><img src="img/icons/value.png"><span><span class="item"><a href="https://www.ipbes.net/node/48281">Value perspective on nature:</a></span><span class="value">${c.value}</span></span></li>
            <li title="Protected areas: Ramsar sites, Swiss National Park, UNESCO Biosphere Reserves, UNESCO Cultural Sites, UNESCO Natural Sites, ProNatura reserves, Emerald sites, cantonal PAs, biodiversity promotion areas of quality II"><img src="img/icons/protected.png"><span><span class="item"><span>Protected areas (<a href="https://www.bafu.admin.ch/bafu/de/home/themen/thema-biodiversitaet/biodiversitaet--daten--indikatoren-und-karten/biodiversitaet--indikatoren/indikator-biodiversitaet.pt.html/aHR0cHM6Ly93d3cuaW5kaWthdG9yZW4uYWRtaW4uY2gvUHVibG/ljL0FlbURldGFpbD9pbmQ9QkQxNjA.">proportion of Swiss land area</a> and <a href="https://portals.iucn.org/library/sites/library/files/documents/pag-021.pdf">management</a>):</span></span><span class="value">${c.protected}</span></span></li>`
$('section[name="'+key+'"] ul').html(myString);
		}
	  }
})