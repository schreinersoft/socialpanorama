function fillResultsTable() {
    var QueryString = getRequests();
	const params=['p1dist','p1angle','p2dist','p2angle','p3dist','p3angle'];
	for (var p=0;p<params.length;p++) {
		var res=QueryString[params[p]];
		if (res && res!=-99) {
			var el=document.getElementById(params[p]);
			el.innerHTML=res;
			}
		}
	};
	
// ----------------------------------------------------------------------------------------- EXTERNAL FUNCTIONS

function getRequests() {
    var s1 = location.search.substring(1, location.search.length).split('&'),
        r = {}, s2, i;
    for (i = 0; i < s1.length; i += 1) {
        s2 = s1[i].split('=');
        r[decodeURIComponent(s2[0]).toLowerCase()] = decodeURIComponent(s2[1]);
    }
    return r;
};


