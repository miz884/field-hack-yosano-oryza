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

