function render(data) { 
  /* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */

    ////////////////////////////////////////////////////////////// 
    //////////////////////// Set-Up ////////////////////////////// 
    ////////////////////////////////////////////////////////////// 

    var margin = {top: 100, right: 100, bottom: 100, left: 100},
        width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
            
    ////////////////////////////////////////////////////////////// 
    //////////////////// Draw the Chart ////////////////////////// 
    ////////////////////////////////////////////////////////////// 

    var color = d3.scale.ordinal()
        .range(["#EDC951","#CC333F","#00A0B0"]);
        
    var radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: 0.5,
      levels: 5,
      roundStrokes: true,
      color: color
    };
    //Call function to draw the Radar chart
    RadarChart(".radarChart", data, radarChartOptions);
};

function loader() {

    const pathblock = window.location.pathname.split('/');
    const users = pathblock.pop();
    console.log("testing if pseudonym is:", users);

    if(_.size( users.split(',')) != 2) {
        console.log("failed first integrity check");
        return;
    }
    if(_.size( users.split('-')) != 5) {
        console.log("failed second integrity check");
        return;
    }

    $.getJSON("/api/v1/radar/" + users, function(data) {
    /* this is the format
         {axis:"Battery Life",value:0.22}, 
         {axis:"Brand",value:0.28},          */
        console.log(data);

        render(data.tops);
    });
};

