var locationInit = function() {
  PRODUCT_LINKS.forEach(function(link) {
    if (! LOCATIONS[link.source].outgoing) {
      LOCATIONS[link.source].outgoing = [];
    }
    LOCATIONS[link.source].outgoing.push(link);
    if (! LOCATIONS[link.destination].incoming) {
      LOCATIONS[link.destination].incoming = [];
    }
    LOCATIONS[link.destination].incoming.push(link);
  });
};


var formatLocation = function(location) {
  var content = "";
  // Title.
  content += "<h2>";
  content +=  (location.url ? "<a href='" + location.url + "'>" : "");
  content +=  location.name;
  content +=  (location.url ? "</a>" : "");
  content +=  "</h2>";
  // Incoming.
  if (location.incoming) {
    content +=  "<div>";
    location.incoming.forEach(function(link) {
      content +=  "ここでは";
      content +=  LOCATIONS[link.source].name;
      content +=  "の";
      content +=  link.product_name;
      content +=  "を使っています。<br />";
    });
    content +=  "</div>";
  }
  // Outgoing.
  if (location.outgoing) {
    content +=  "<div>";
    location.outgoing.forEach(function(link) {
      content +=  LOCATIONS[link.destination].name;
      content +=  "がここの";
      content +=  link.product_name;
      content +=  "を使っています。<br />";
    });
    content +=  "</div>";
  }
  // Description.
  content +=  "<div>";
  content +=  location.desc;
  content +=  "</div>";
  return content;
}
