const MARGIN = { LEFT: 140, RIGHT: 0, TOP: 10, BOTTOM: 100 };

const WIDTH = 1200 - MARGIN.LEFT - MARGIN.RIGHT;
const HEIGHT = 700 - MARGIN.TOP - MARGIN.BOTTOM;
const MOBILE_HEIGHT = 800;
const MOBILE_WIDTH = 900;

const isMobile = window.innerWidth < 1000 ? true : false;
// const offset = 22;
// const offsetX = 4200;
// const offsetXEV = 4200;
const offset = 22;
const offsetX = 3000;
const offsetXEV = 4000;


const svgWidth = isMobile ? window.innerWidth : WIDTH;
const svgHeight = isMobile ? MOBILE_HEIGHT : HEIGHT;
console.log(isMobile)

// Flag for jumping between data on Y axis
let flag = true;

// SVG Icons
const iconPath = "../public/icons/icon-compact.svg";

// Counter for the step function that calls the update function.
let time = 1;
let year = 365;
let mileage = 60;
let annualMileage = mileage * year;
let gas = 1.8;
let annualGas = gas * year;
let electricity = 20;
let annualElectricity = electricity * year;
let provincialRebate = 0;
let totalRebate = provincialRebate;
let insurance = 1800;
let interval;
let vehicles;
let totalOperatingCost;

function calculatePHEVOperatingCost(
  kmPerKwh,
  gasPricePerLiter,
  annualMileage,
  electricityPricePerKwh
) {
  // Convert kmPerKwh to 100 km
  kmPerKwh = kmPerKwh * 100;

  // Conver electricity to cents
  electricityPricePerKwh = electricityPricePerKwh / 100;

  // Convert kmPerKwh to kWh/100km
  const kWhPer100km = 100 / kmPerKwh;

  // Gasoline consumption per 100 km (liters)
  const gasolineConsumptionPer100km = 100 / kmPerKwh;

  // Gasoline cost per kWh equivalent
  const gasolineCostPerKwh = gasPricePerLiter / 8.9;

  // Electricity consumption per 100 km (kWh)
  const electricityConsumptionPer100km = kWhPer100km;

  // Calculate total gasoline cost for the year
  const totalGasolineCost =
    gasolineConsumptionPer100km * annualMileage * gasolineCostPerKwh;

  // Calculate total electricity cost for the year
  const totalElectricityCost =
    electricityConsumptionPer100km * annualMileage * electricityPricePerKwh;

  // Calculate total annual operating cost
  const totalOperatingCost = totalGasolineCost + totalElectricityCost;
  return totalOperatingCost;
}

function calculateEVCost(distanceInKm, energyConsumptionPer100Km, costPerKwh) {
  // Convert electricity to cents
  costPerKwh = costPerKwh / 100;

  // Convert energy consumption to kWh/km
  const energyConsumptionPerKm = energyConsumptionPer100Km / 100;

  // Calculate total energy consumed in kWh
  const totalEnergyConsumed = distanceInKm * energyConsumptionPerKm;

  // Calculate total cost of driving the EV
  const totalCost = totalEnergyConsumed * costPerKwh;

  return totalCost;
}

// Update purchase price after rebates
function updatedPurchasePrice(vehicles) {
  vehicles.forEach((d) => {
    if (d.type === "ev" || d.type === "phev") {
      return x(d.purchase_price - provincialRebate);
    } else {
      return x(d.purchase_price);
    }
  });
}

// Create SVG
const svg = d3
  .select("#chart-area")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight + MARGIN.TOP + MARGIN.BOTTOM)
  .append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);



const g = svg
  .append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);



// //Tooltip
const tip = d3
  .tip()
  .attr("class", "d3-tip")
  .html((d) => {
    let text = `Vehicle: ${d.model}<br />`;
    text += `Total Cost: $${d3.format(",.2f")(d.total_cost)}<br />`;
    text += `Purchase Price: $${d3.format(",.2f")(d.purchase_price)}<br />`;
    // text += `Operating Cost: $${d3.format(",.2f")(d[`year${time}`])}<br />`;
    text += `Operating Cost: $${d3.format(",.2f")(d.total_cost - (d.purchase_price) + provincialRebate)}<br />`;

    return text;
  });

g.call(tip);

// Define scales and axes (will set domains later)
const x = d3.scaleLinear().range([0, isMobile ? MOBILE_WIDTH - 200 : WIDTH - 200]);

const y = d3.scaleBand().range([isMobile ? MOBILE_HEIGHT : HEIGHT, 0]);

const color = d3.scaleOrdinal(d3.schemeTableau10);

const xAxisGroup = g
  .append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(-100, ${isMobile ? MOBILE_HEIGHT : HEIGHT})`);

const yAxisGroup = g
  .append("g")
  .attr("class", "y axis")
  .attr("transform", `translate(-105)`);

const radiusScale = d3
  .scaleLinear()
  .domain([34720, 78400]) // Range of cost values
  .range([3, 13]); // Range of radius values

// Add labels
svg
  .append("text")
  .attr("x", WIDTH / 2)
  .attr("y", isMobile ? MOBILE_HEIGHT + 90 : HEIGHT + 90)
  .attr("text-anchor", "middle")
  .text("Total Cost (CAN $)");

const yLabel = g
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", isMobile ? -MOBILE_HEIGHT / 2 : -HEIGHT / 2)
  .attr("y", -MARGIN.LEFT)
  .attr("text-anchor", "middle");

/**
 * DATA
 */
d3.json("data/vehicleCost.json").then((data) => {
  vehicles = data[0].vehicles;

  // Calculate Mileage for Gas Vehicles
  vehicles.forEach((d) => {
    switch (d.type) {
      case "gas":
        d.annual_gas = Number((annualMileage / d.mileage) * gas);
        break;
      case "hybrid":
        d.annual_gas = Number((annualMileage / d.mileage) * gas);
        break;
      case "phev":
        d.annual_gas = Number((annualMileage / d.mileage) * gas);
        break;
      default:
        d.annual_gas = Number((annualMileage / d.mileage) * gas);
        break;
    }
  });

  // Calculate the first year overall cost
  vehicles.forEach((d) => {
    d.year1 = Number(d.annual_gas);
    d.year2 = Number(d.year1 + d.annual_gas);
    d.year3 = Number(d.year2 + d.annual_gas);
    d.year4 = Number(d.year3 + d.annual_gas);
    d.year5 = Number(d.year4 + d.annual_gas);
    d.year6 = Number(d.year5 + d.annual_gas);
    d.year7 = Number(d.year6 + d.annual_gas);
    d.year8 = Number(d.year7 + d.annual_gas);
  });

  /**
   * Legend
   */
  const vehicleTypes = ["gas", "hybrid", "phev", "ev"];

  // Set domains
  color.domain(vehicleTypes);

  const legend = g
    .append("g")
    .attr("transform", `translate(${WIDTH - 1050}, ${HEIGHT - 480})`);

  vehicleTypes.forEach((vehicle, i) => {
    const legendeRow = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendeRow
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", color(vehicle));

    legendeRow
      .append("text")
      .attr("x", -10)
      .attr("y", 10)
      .attr("text-anchor", "end")
      .style("text-transform", "uppercase")
      .text(vehicle);
  });

  update(vehicles, time, mileage, annualMileage);
}); // End Data Function

// Step Function
function step() {
  time = time < 8 ? time + 1 : 1;
  update(vehicles, time, mileage, annualMileage);
}

// Pause and Play Button Logic
$("#play-button").on("click", function () {
  const button = $(this);

  if (button.text() === "Play") {
    button.text("Pause");
    interval = setInterval(step, 1000);
  } else {
    clearInterval(interval);
    button.text("Play");
  }
});

// Reset Button Logic
$("#reset-button").on("click", () => {
  time = 1;
  update(vehicles, time, mileage, annualMileage);
});

// This is here so that changes are seen when the animation is not running.
$("#type-select").on("change", () => {
  update(vehicles, time, mileage, annualMileage);
});

// Date Slider
$("#date-slider").slider({
  min: 1,
  max: 8,
  step: 1,
  slide: (event, ui) => {
    time = ui.value;
    update(vehicles, time, mileage, annualMileage);
  },
});

// Mileage Slider - jQuery
$("#mileage-slider").slider({
  min: 10,
  max: 200,
  step: 10,
  slide: (event, ui) => {
    mileage = ui.value;
    annualMileage = mileage * year;
    update(vehicles, time, mileage, annualMileage);
  },
});


// Gas Price
$("#gas-slider").slider({
  min: 0,
  max: 4.0,
  step: 0.1,
  value: 1.8,
  slide: (event, ui) => {
    gas = ui.value;
    annualGas = gas * year;
    update(vehicles, time, mileage, annualMileage, annualGas);
  },
});

// Electricity Slider
$("#electricity-slider").slider({
  min: 0,
  max: 50,
  step: 2,
  value: 12,
  slide: (event, ui) => {
    electricity = ui.value;
    annualElectricity = electricity * year;
    update(vehicles, time, mileage, annualMileage);
  },
});

// Provincial Rebate
$("#rebate-slider").slider({
  min: 0,
  max: 15000,
  step: 500,
  value: 0,
  slide: (event, ui) => {
    provincialRebate = ui.value;
    update(vehicles, time, mileage, annualMileage);
  },
});


// Insurance Cost
$("#insurance-slider").slider({
  min: 0,
  max: 3000,
  step: 100,
  value: 1800,
  slide: (event, ui) => {
    insurance = ui.value;
    update(vehicles, time, mileage, annualMileage);
  },
});

/**
 *
 * UPDATE FUNCTION
 */
// Anything that needs updating should live in here.
function update(vehicles, time, mileage, annualMileage, annualGas) {
  // Transition Variable
  const t = d3.transition().duration(750);

  // Filter based on Vehicle type - there is another version of this outside of the update
  //function to allow this to work while animation is paused, or hasn't started.
  const typeSelection = $("#type-select").val();
  const filteredData = vehicles.filter((d) => {
    if (typeSelection === "all") return true;
    else {
      return d.type == typeSelection;
    }
  });

  // Update the annual mileage
  const mileageSelection = $("#mileage-slider").val();
  // mileage = mileageSelection;
  // const gasSelection = $("#gas-slider").val();
  // gas = gasSelection;

  annualMileage = mileage * year;

  filteredData.forEach((d) => {
    switch (d.type) {
      case "gas":
        d.annual_gas = Number((annualMileage / d.mileage) * gas);
        break;
      case "hybrid":
        d.annual_gas = Number((annualMileage / d.mileage) * gas);
        break;
      case "phev":
        d.annual_gas = Number(
          calculatePHEVOperatingCost(d.mileage, gas, annualMileage, electricity)
        );
        break;
      case "ev":
        d.annual_gas = Number(
          calculateEVCost(annualMileage, d.mileage, electricity)
        );
        break;
      default:
        d.annual_gas = Number((annualMileage / d.mileage) * gas);
        break;
    }
  });

  // Recalculate total annual cost for each vehicle
  filteredData.forEach((d) => {
    d.year1 = Number(d.annual_gas);
    d.year2 = Number(d.year1 + d.annual_gas );
    d.year3 = Number(d.year2 + d.annual_gas );
    d.year4 = Number(d.year3 + d.annual_gas );
    d.year5 = Number(d.year4 + d.annual_gas );
    d.year6 = Number(d.year5 + d.annual_gas );
    d.year7 = Number(d.year6 + d.annual_gas );
    d.year8 = Number(d.year7 + d.annual_gas );
  });

  // Recalculate Total Vehicle Overhead
  filteredData.forEach((d) => {
    if (d.type === "ev" || d.type === "phev") {
      console.log(vehicles)

      d.total_cost = d.purchase_price + d[`year${time}`] - provincialRebate + (insurance*time) + (d.annual_maint * time);

    } else {
      d.total_cost = d.purchase_price + d[`year${time}`] + (insurance*time) + (d.annual_maint * time);
    }
  });

  // Order by category for the y-axis. It makes it more interesting to look at. 
  filteredData.sort((a, b) => d3.ascending(a.cat, b.cat));


  // Update radius values
  const maxRadius = d3.max(filteredData, (d) => d.purchase_price);
  radiusScale.domain([30000, maxRadius]);

  // Extract unique vehicle types from filtered data
  const vehicleTypes = [...new Set(filteredData.map((d) => d.type))];

  // Domains
  // x.domain([30000, d3.max(filteredData, (d) => d.purchase_price + 10000)]);
  x.domain([30000, d3.max(filteredData, (d) => d.total_cost + 20000)]);
  y.domain(filteredData.map((d) => d.model));

  // y.domain([
  //   // d3.min(filteredData, (d) => {
  //   //   return d.model
  //   // }),
  //   // d3.max(filteredData, (d) => {
  //   //   return d.model
  //   // }),

  // ]);

  // Add axes from variable declared above. This way the chart does not continue to stack on
  // itself everytime update() is called.
  xAxisGroup
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-40)");

  yAxisGroup.call(d3.axisLeft(y));

  /**
   * D3 Update Pattern - Very Important
   */
  /**
   * JOIN
   * Join the new data with old elements
   */

  const circles = svg.selectAll("circle").data(filteredData);

  /**
   * EXIT
   * Remove old elements as needed
   */

  circles.exit().remove();

  /**
   * UPDATE
   * Update old elements
   */
  circles
    .transition(t)
    .attr("fill", (d) => color(d.type))
    // .attr("cy", (d) => y(d[`year${time}`]))
    .attr("cy", (d) => y(d.model) + offset)

    .attr("cx", (d) => {
      if (d.type === "ev" || d.type === "phev") {

        return x(d.total_cost - (provincialRebate / 8) + offsetXEV);
      } else {
        return x(d.total_cost + offsetX);
      }
    })
    .attr("r", (d) => radiusScale(d.total_cost))
    .attr("width", x.bandwidth);




    console.log(insurance, time)
  //Tooltip
//   const tip = d3
//   .tip()
//   .attr("class", "d3-tip")
//   .html((d) => {
//     let text = `Vehicle: ${d.model}<br />`;
//     text += `Total Cost: $${d3.format(",.2f")(d.total_cost)}<br />`;
//     text += `Purchase Price: $${d3.format(",.2f")(d.purchase_price)}<br />`;
//     // text += `Operating Cost: $${d3.format(",.2f")(d[`year${time}`])}<br />`;
//     text += `Operating Cost: $${d3.format(",.2f")(d.total_cost - (d.purchase_price + provincialRebate > 0 ? provincialRebate : 0)  )}<br />`;

//     return text;
//   });

// g.call(tip);
  /**
   * ENTER
   * Create new elements as needed
   */

  circles
    .enter()
    .append("circle")
    .attr("fill", (d) => color(d.type))
    .attr("cx", (d) => {
      if (d.type === "ev" || d.type === "phev") {

        return x(d.total_cost - (provincialRebate / 8) + offsetXEV);
      } else {
        return x(d.total_cost + offsetX);
      }
    })
    .attr("cy", (d) => y(d.model) + offset)
    .attr("r", (d) => radiusScale(d.total_cost))
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);



  const text = flag ? "Fuel / Electricity Cost (CAN $)" : "First Year Overall Cost";
  // yLabel.text(text);

  $("#year")[0].innerHTML = String(time);
  $("#date-slider").slider("value", Number(time));
  $("#km")[0].innerHTML = String(mileage);
  $("#mileage-slider").slider("value", Number(mileage));
  $("#gas")[0].innerHTML = String(gas);
  $("#gas-slider").slider("value", Number(gas));
  $("#electricity")[0].innerHTML = String(electricity);
  $("#electricity-slider").slider("value", Number(electricity));
  $("#rebate")[0].innerHTML = String(provincialRebate);
  $("#rebate-slider").slider("value", Number(provincialRebate));
  $("#insurance")[0].innerHTML = String(insurance);
  $("#insurance-slider").slider("value", Number(insurance));

}
