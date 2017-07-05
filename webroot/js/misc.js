var locationInit = function() {
  var products = {};
  PRODUCT_LINKS.forEach(function(link) {
    if (! products[link.source]) {
      products[link.source] = {};
    }
    products[link.source][link.product] = true;
    if (link.source && link.destination) {
      if (! LOCATIONS[link.source].outgoing) {
        LOCATIONS[link.source].outgoing = [];
      }
      LOCATIONS[link.source].outgoing.push(link);
      if (! LOCATIONS[link.destination].incoming) {
        LOCATIONS[link.destination].incoming = [];
      }
      LOCATIONS[link.destination].incoming.push(link);
    }
  });
  Object.keys(products).forEach(function(source) {
    LOCATIONS[source].products = Object.keys(products[source]);
  });
};

var formatLocation = function(loc) {
  // Create element
  function ce(tag, children) {
    var e = document.createElement(tag);
    if (children) {
      children.forEach(function(c){
        e.appendChild(c);
      });
    }
    return e;
  };
  // Text node.
  function t(content) {
    return document.createTextNode(content);
  };
  // Append Children.
  function ac(p, children) {
    children.forEach(function(c){
      p.appendChild(c);
    });
    return p;
  };
  // Anchor tag.
  function a(text, href, onclick) {
    var a = ce("a", []);
    a.innerText = text;
    a.href = (href ? href : "#");
    if (onclick) {
      a.onclick = onclick;
    }
    return a;
  };
  // div.
  function div(children) {
    return ce("div", children);
  }
  // br
  function br() {
    return ce("br");
  }
  var result = div([
    ce("h2", [
      (loc.url ? a(loc.name, loc.url) : t(loc.name))
    ])
  ]);
  // Products.
  if (loc.products) {
    var lines = [ce("b", [t("作っているもの"), br()])];
    loc.products.forEach(function(product) {
      lines.push(
        t("ここでは"),
        t(PRODUCTS[product].name),
        t("を作っています。"),
        br()
      );
    });
    ac(result, [div(lines)]);
  }
  // Incoming.
  if (loc.incoming) {
    var lines = [ce("b", [t("使っているもの"), br()])];
    loc.incoming.forEach(function(link) {
      lines.push(
        t("ここでは"),
        a(LOCATIONS[link.source].name, "#" + link.source, function() {
          showDialog(formatLocation(LOCATIONS[link.source]));
          directionsManager.showInOut(LOCATIONS[link.source]);
        }),
        t("の"),
        t(link.product_name),
        t("を使っています。"),
        br()
      );
    });
    ac(result, [div(lines)]);
  }
  // Outgoing.
  if (loc.outgoing) {
    var lines = [ce("b", [t("ここで作られたものを使っている人達"), br()])];
    loc.outgoing.forEach(function(link) {
      lines.push(
        a(LOCATIONS[link.destination].name, "#" + link.destination, function() {
          showDialog(formatLocation(LOCATIONS[link.destination]));
          directionsManager.showInOut(LOCATIONS[link.destination]);
        }),
        t("がここの"),
        t(link.product_name),
        t("を使っています。"),
        br()
      );
    });
    ac(result, [div(lines)]);
  }
  // Description.
  var desc = div();
  desc.innerHTML = loc.desc;
  ac(result, [desc]);
  return result;
};

var formatLink = function(link) {
  var source = LOCATIONS[link.source];
  var dest = LOCATIONS[link.destination];
  var result = dest.name;
  result += "では<br />";
  result += source.name;
  result += "の";
  result += link.product_name;
  result += "を使っています";
  return result;
};

var showDialog = function(content) {
  var dialog = document.getElementById('location_desc_dialog');
  var container = document.getElementById('location_desc_content');
  dialog.close();
  container.innerHTML = "";
  container.appendChild(content);
  dialog.open();
};

var parseDeepLink = function() {
  if (location.hash.length > 0) {
    var hash = location.hash.substring(1);
    var loc = LOCATIONS[hash];
    if (loc) {
      showDialog(formatLocation(loc));
      directionsManager.showInOut(loc);
      map.setCenter({"lat":loc.lat, "lng":loc.lng});
    } else if (hash == "DASHBOARD") {
      console.log("Dashboard mode.");
      // Listen on Firebase Database.
      listenPing(function(loc) {
        showDialog(formatLocation(loc));
        directionsManager.showInOut(loc);
      });
    }
  }
};

var listenPing = function(callback) {
  var pingRef =  firebase.database().ref('/ping');
  pingRef.on('value', function(snapshot) {
    var val = snapshot.val();
    console.log("pinged:");
    console.log(val);
    if (val && val.label) {
      var loc = LOCATIONS[val.label];
      if (loc) {
        callback(loc);
      }
    }
  });
};

var showMessage = function(message) {
  var toast = document.getElementById("message");
  toast.text = message;
  toast.open();
};
