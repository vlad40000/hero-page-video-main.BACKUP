export type RepairGuide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  symptoms: string[];
  causes: {
    item: string;
    cost: string;
    description: string;
  }[];
  articleMarkdown: string;
};

export const REPAIR_GUIDES: RepairGuide[] = [
  {
    slug: "washer-wont-drain-causes-repair-costs",
    title: "Washer Won't Drain",
    description:
      "A washer that will not drain is usually caused by a blockage or a failed drain-related component.",
    category: "Washer",
    symptoms: [
      "Water remains in the drum",
      "Washer will not spin",
      "Drain or door-lock error code",
      "Humming sound during drain cycle",
    ],
    causes: [
      {
        item: "Clogged Drain Pump Filter or Coin Trap",
        cost: "Often $0 DIY",
        description: "Coins, lint, hair, socks, or pocket debris can block water from leaving the washer.",
      },
      {
        item: "Kinked or Clogged Drain Hose",
        cost: "$100-$150",
        description: "A bent, crushed, over-inserted, or clogged drain hose can stop proper draining.",
      },
      {
        item: "Faulty Lid Switch or Door Lock",
        cost: "$150-$300",
        description: "If the washer thinks the lid or door is open, it may not drain or spin.",
      },
      {
        item: "Failed Drain Pump Motor",
        cost: "$150-$350",
        description: "A burned-out, jammed, or unpowered pump usually requires replacement.",
      },
    ],
    articleMarkdown: `# Washer Won't Drain

A washer that will not drain is usually caused by a blockage or a failed drain-related component. The machine may fill and wash normally, but when it reaches the drain or spin portion of the cycle, water remains in the drum.

In many cases, the problem is simple and inexpensive to fix. The most common causes are clogged filters, blocked hoses, or debris caught in the drain pump area. Before calling a technician, check for physical blockages first.

## Common Causes

### 1. Clogged Drain Pump Filter or Coin Trap

A clogged drain pump filter or coin trap is one of the most common reasons a washer will not drain.

Many washers have a filter or trap designed to catch debris before it reaches the drain pump. Over time, this area can collect coins, lint, hair, buttons, small socks, fabric pieces, dirt, and other objects left in pockets.

When the filter becomes blocked, water cannot leave the washer properly. The machine may stop mid-cycle, leave standing water in the drum, or refuse to spin because it still detects water inside.

This is often the easiest and cheapest issue to fix. In many cases, clearing the filter solves the problem without replacing any parts.

### 2. Kinked, Crushed, or Clogged Drain Hose

The drain hose carries water from the washer to the home's drain pipe, utility sink, or standpipe. If the hose is bent, crushed, or clogged, the washer may not be able to pump water out.

Common hose problems include:

* Washer pushed too close to the wall
* Hose kinked behind the machine
* Hose clogged with lint or debris
* Drain hose inserted too far into the standpipe
* Crushed hose restricting water flow

A blocked or restricted hose can cause slow draining or no draining at all. This issue is usually easy to inspect and may not require replacement unless the hose is damaged.

### 3. Faulty Lid Switch or Door Lock Assembly

Washers have safety switches that tell the machine whether the lid or door is closed. If the washer thinks the lid or door is open, it may not drain or spin.

This is common on both top-load and front-load washers. Top-load washers often use a lid switch, while front-load washers use a door lock assembly.

Signs of this issue include:

* Washer fills and washes but will not drain or spin
* Door lock error code
* Lid does not click or lock properly
* Machine stops when it reaches the drain or spin cycle

If the switch or lock assembly fails, the washer may not continue the cycle even if the drain system itself is clear.

### 4. Failed Drain Pump Motor

If the filter and hose are clear, the drain pump motor may have failed.

The drain pump pushes water out of the washer. If the motor burns out, jams, or stops receiving power, the washer will not drain properly.

Signs of a bad drain pump include:

* Humming sound but no draining
* No pump sound during the drain cycle
* Water stuck in the drum
* Burning smell near the pump area
* Drain-related error code
* Washer drains only sometimes

A failed drain pump usually requires replacement.

## Typical Cost Breakdown

### DIY / No-Cost Fix

If the issue is a clog in the drain hose, pump filter, or coin trap, the repair may cost nothing.

Common free fixes include:

* Removing debris from the pump filter
* Clearing the coin trap
* Straightening the drain hose
* Flushing out a clogged hose
* Repositioning the washer so the hose is not crushed

### Professional Repair Cost

A professional washer drain repair typically costs:

**$150-$350**

The final cost depends on the washer brand, part availability, labor rates, and whether the pump, switch, lock, or hose needs replacement.

### Parts Cost

A replacement drain pump usually costs:

**$50-$100**

Labor is usually the larger part of the final repair bill.

## What to Check Before Calling a Technician

### Step 1: Unplug the Washer

Always unplug the washer before inspecting the drain system. If there is standing water inside, have towels or a shallow pan ready.

### Step 2: Check the Drain Pump Filter or Coin Trap

Look for a small access panel near the bottom front of the washer. Open it slowly because water may spill out. Remove debris, clean the filter, and reinstall it securely.

### Step 3: Inspect the Drain Hose

Pull the washer away from the wall and inspect the drain hose for kinks, crushed sections, clogs, or improper placement.

### Step 4: Check the Household Drain

If water backs up from the standpipe or utility sink, the washer may not be the problem. The home's drain line may be clogged.

### Step 5: Listen for the Drain Pump

Run a drain or spin cycle and listen. If the pump hums but water does not move, there may be a blockage or jammed pump. If the pump makes no sound, the issue may be electrical, a bad lid switch, a faulty door lock, or a failed pump motor.

## Bottom Line

The most common reason a washer will not drain is a clogged pump filter, coin trap, or drain hose. Start by unplugging the washer, clearing physical blockages, and checking the hose for kinks or clogs. If the washer still will not drain, the issue may be a faulty door lock, lid switch, or drain pump motor.`,
  },
  {
    slug: "dryer-not-heating-common-fixes",
    title: "Dryer Not Heating",
    description:
      "A dryer that runs but does not heat is usually caused by restricted airflow, a blown safety fuse, or a failed heating component.",
    category: "Dryer",
    symptoms: [
      "Dryer tumbles but produces no heat",
      "Clothes stay damp after a full cycle",
      "Dryer takes multiple cycles to dry",
      "Burning smell or repeated fuse failure",
    ],
    causes: [
      {
        item: "Blown Thermal Fuse",
        cost: "$120-$180",
        description: "A safety fuse often blows when restricted airflow causes the dryer to overheat.",
      },
      {
        item: "Burned-Out Heating Element",
        cost: "$200-$300",
        description: "On electric dryers, a broken heating coil prevents heat production.",
      },
      {
        item: "Faulty Gas Valve Coils or Igniter",
        cost: "$180-$280",
        description: "Gas dryers may fail to heat if the burner system cannot ignite or stay lit.",
      },
      {
        item: "Clogged Lint Screen or Vent Line",
        cost: "Often $0-$200",
        description: "Poor airflow can prevent drying and cause overheating or repeated thermal fuse failures.",
      },
    ],
    articleMarkdown: `# Dryer Not Heating

A dryer that runs but does not heat is usually caused by restricted airflow, a blown safety fuse, or a failed heating component. The dryer may still tumble normally, but clothes remain damp because heat is either not being produced or cannot move through the machine properly.

Before replacing parts, the first thing to check is airflow. A clogged lint screen, blocked vent hose, or restricted house vent line can cause overheating, poor drying, and repeated thermal fuse failure.

## Common Causes

### 1. Blown Thermal Fuse

A blown thermal fuse is one of the most common reasons a dryer stops heating.

The thermal fuse is a safety device that protects the dryer from overheating. If the dryer gets too hot, the fuse blows and cuts power to the heating circuit. In many cases, this happens because hot air cannot escape through the vent system properly.

Common reasons a thermal fuse blows include:

* Clogged lint screen
* Blocked dryer vent hose
* Crushed or kinked vent duct
* Lint buildup inside the dryer cabinet
* Blocked exterior vent flap
* Long or poorly installed vent run
* Poor airflow through the main house vent line

Once a thermal fuse blows, it usually cannot be reset. It must be replaced.

However, replacing the fuse without fixing the airflow problem can cause the new fuse to blow again.

### 2. Burned-Out Heating Element

On electric dryers, the heating element creates the heat used to dry clothes. Over time, the heating coil can burn out, break, or short.

When the heating element fails, the dryer may still run and tumble, but it will not produce heat.

Signs of a burned-out heating element include:

* Dryer tumbles but does not heat
* Clothes stay damp after a full cycle
* Dryer takes multiple cycles to dry clothes
* Heat works sometimes, then stops
* Visible break in the heating coil
* Burning smell before the dryer stopped heating

Heating element replacement is a common electric dryer repair. The part is usually moderately priced, but labor can increase the total repair cost.

### 3. Faulty Gas Valve Coils or Igniter

Gas dryers use a burner system instead of an electric heating element. If a gas dryer is not heating, the problem may be the igniter, gas valve coils, flame sensor, or gas supply.

The igniter lights the gas burner. If the igniter fails, the burner will not ignite.

The gas valve coils open the gas valve so gas can flow to the burner. If the coils fail, the dryer may heat briefly at the beginning of the cycle and then stop heating.

Signs of gas dryer heating problems include:

* Dryer tumbles but produces no heat
* Igniter glows but burner does not light
* Dryer heats at first, then stops heating
* Clicking sound without ignition
* Clothes take too long to dry
* Dryer only heats intermittently

Gas dryer repairs should be handled carefully. If you smell gas, stop using the dryer immediately, shut off the gas supply if it is safe, and contact a qualified technician or gas utility.

### 4. Clogged Lint Screen or Main House Vent Line

Restricted airflow is one of the most important causes of dryer heating problems.

Even if the dryer is producing heat, poor airflow prevents hot air from moving through the drum and out of the house. This causes clothes to dry slowly and can make the dryer overheat.

Common airflow restrictions include:

* Dirty lint screen
* Lint buildup in the dryer vent hose
* Blocked wall duct
* Bird nest or debris in the exterior vent
* Crushed flexible vent hose
* Too many bends in the vent line
* Long vent run with poor airflow
* Exterior vent flap stuck closed

A clogged vent can cause the thermal fuse to blow repeatedly. It can also increase drying time, raise energy costs, damage clothing, and increase the risk of a dryer fire.

## Typical Cost Breakdown

### Professional Repair Cost

A professional dryer heating repair typically costs:

**$150-$400**

The final cost depends on the dryer brand, electric or gas model, failed part, labor rates, accessibility, and whether vent cleaning is needed.

### Parts Cost

Common dryer heating parts usually cost:

**Thermal fuse:** **$10-$25**

**Heating element:** **$40-$150**

Other parts, such as gas valve coils, igniters, thermostats, and flame sensors, vary by model.

## What to Check Before Calling a Technician

### Step 1: Clean the Lint Screen

Remove the lint screen and clean it completely. The lint screen should be cleaned before or after every load.

If the screen has waxy buildup from dryer sheets, wash it with warm water, dish soap, and a soft brush. Let it dry fully before reinstalling it.

### Step 2: Inspect the Dryer Vent Hose

Pull the dryer away from the wall and check the vent hose.

Look for kinks, crushed sections, loose connections, heavy lint buildup, tears, or long twisted vent routing.

Straighten the hose if it is kinked. Replace it if it is crushed, torn, or packed with lint.

### Step 3: Check the Exterior Vent

Go outside and inspect the exterior dryer vent while the dryer is running. You should feel strong airflow coming from the vent.

If airflow is weak, the vent line may be clogged. Also check that the exterior flap opens freely and is not blocked by lint, leaves, snow, debris, or a bird nest.

### Step 4: Run a Heat Test

After cleaning the lint screen and checking the vent, run the dryer on a heat cycle.

If the dryer heats normally after airflow is restored, the issue may have been a clogged vent or lint screen.

If the dryer still does not heat, the issue may be a blown thermal fuse, burned-out heating element, failed igniter, bad gas valve coils, thermostat issue, or wiring problem.

### Step 5: Identify Whether the Dryer Is Electric or Gas

For an electric dryer, common no-heat causes include a burned-out heating element, blown thermal fuse, faulty high-limit thermostat, bad cycling thermostat, or power supply issue.

For a gas dryer, common no-heat causes include a faulty igniter, bad gas valve coils, blown thermal fuse, flame sensor issue, or gas supply problem.

## Important Safety Note

Do not ignore dryer vent cleaning.

A blown thermal fuse is often a symptom of poor ventilation. If the vent system remains clogged, the replacement fuse may fail again. More importantly, lint buildup can create a fire hazard.

Clean the lint screen regularly, inspect the vent hose, and make sure the outside vent has strong airflow.

## Bottom Line

A dryer that is not heating is commonly caused by a blown thermal fuse, burned-out heating element, faulty gas dryer ignition part, or restricted airflow. Start by cleaning the lint screen and checking the full dryer vent path. If airflow is good but the dryer still does not heat, the problem is likely an internal heating component that needs testing or replacement.`,
  },
  {
    slug: "refrigerator-not-cooling-troubleshooting",
    title: "Fridge Not Cooling",
    description:
      "A refrigerator that is not cooling properly can be caused by anything from dirty coils to a major sealed-system failure.",
    category: "Refrigerator",
    symptoms: [
      "Fridge is not cold enough",
      "Freezer may also be warm",
      "Compressor clicks or runs constantly",
      "Weak airflow from vents",
    ],
    causes: [
      {
        item: "Dirty Condenser Coils",
        cost: "Often $0 DIY",
        description: "Dust, lint, pet hair, or grease prevents the refrigerator from releasing heat efficiently.",
      },
      {
        item: "Failed Evaporator Fan Motor",
        cost: "$200-$400",
        description: "A failed or ice-blocked fan can leave the fresh-food section warm while the freezer stays cold.",
      },
      {
        item: "Faulty Start Relay or Capacitor",
        cost: "$200-$400",
        description: "If the compressor cannot start correctly, both fridge and freezer may become warm.",
      },
      {
        item: "Failed Compressor or Sealed System Leak",
        cost: "$600-$1,000+",
        description: "Major sealed-system repairs require specialized tools and may not be worth it on older units.",
      },
    ],
    articleMarkdown: `# Fridge Not Cooling

A refrigerator that is not cooling properly can be caused by anything from dirty coils to a major sealed-system failure. The first step is to rule out simple airflow and maintenance problems before assuming the compressor or refrigerant system has failed.

In many cases, poor cooling happens because heat is not escaping from the refrigerator properly. If the condenser coils are covered in dust, pet hair, or grease, the fridge has to work harder and may struggle to maintain the correct temperature.

## Common Causes

### 1. Dirty Condenser Coils

Dirty condenser coils are one of the most common and easiest-to-fix causes of poor refrigerator cooling.

The condenser coils help release heat from the refrigerator. When they are covered with dust, lint, pet hair, or kitchen debris, the fridge cannot get rid of heat efficiently. This can cause the refrigerator compartment to become warm, the compressor to run constantly, or the unit to use more energy than normal.

This issue is especially common in homes with pets. Dog hair and dust can build up quickly around the coils, fan, and lower rear compartment.

Signs of dirty condenser coils include:

* Fridge is not cold enough
* Freezer may also be warmer than normal
* Compressor runs constantly
* Refrigerator feels hot around the sides or back
* Dust or pet hair visible underneath or behind the unit
* Cooling improves after cleaning

This is usually a DIY maintenance issue and may cost nothing to fix.

### 2. Failed Evaporator Fan Motor

The evaporator fan moves cold air from the freezer section into the refrigerator compartment. If this fan fails, the freezer may stay cold while the fresh-food section becomes warm.

This is a common issue when the freezer seems normal but the fridge side is not cooling properly.

Signs of a bad evaporator fan motor include:

* Fridge section is warm
* Freezer still feels cold
* No fan sound inside the freezer
* Weak airflow from fridge vents
* Frost buildup near the evaporator cover
* Fan makes squealing, clicking, or grinding noises

Sometimes the fan is not failed but blocked by ice. If ice buildup is stopping the fan blade, there may be a defrost system problem instead.

### 3. Faulty Compressor Start Relay or Capacitor

The compressor start relay and capacitor help the compressor turn on. If either part fails, the compressor may not start correctly, which prevents the refrigerator from cooling.

This is usually a moderate repair compared with a full compressor replacement.

Signs of a bad start relay or capacitor include:

* Clicking sound from the back of the fridge
* Compressor tries to start but shuts off
* Fridge and freezer both warm
* Compressor does not run
* Unit cycles on and off quickly
* Burning smell near the compressor area

A bad relay is often much less expensive than a failed compressor. A technician can test the relay, capacitor, compressor windings, and power supply to confirm the issue.

### 4. Failed Compressor or Sealed System Leak

A failed compressor or sealed system leak is the worst-case scenario.

The compressor circulates refrigerant through the cooling system. If the compressor fails, or if the sealed system loses refrigerant, the refrigerator may not be able to cool at all.

Signs of a major sealed-system problem include:

* Fridge and freezer both warm
* Compressor runs but cooling is weak
* Compressor is hot or noisy
* Oily residue near refrigerant lines
* Frost pattern is incomplete on the evaporator coil
* Refrigerator never reaches the set temperature
* Previous repairs did not solve the cooling issue

Compressor and refrigerant repairs are expensive because they require specialized tools, sealed-system work, and proper refrigerant handling. On older refrigerators, this type of repair may not be worth the cost.

## Typical Cost Breakdown

### DIY / Zero-Cost Fix

Cleaning the condenser coils may cost nothing.

Common no-cost steps include:

* Vacuuming dust from the condenser coils
* Removing dog hair from behind or underneath the fridge
* Cleaning around the condenser fan
* Pulling the fridge slightly away from the wall
* Checking that air vents inside the fridge are not blocked
* Making sure the temperature controls are set correctly

### Moderate Professional Repair

Moderate refrigerator cooling repairs usually cost:

**$200-$400**

This range may include evaporator fan replacement, condenser fan replacement, start relay replacement, capacitor replacement, thermostat replacement, sensor replacement, or defrost-related repairs.

### Major Professional Repair

Major refrigerator repairs usually cost:

**$600-$1,000+**

This may include compressor replacement, refrigerant leak repair, sealed system repair, evaporator coil replacement, or refrigerant recharge after leak repair.

These repairs are expensive and may not make sense for an older or lower-cost refrigerator.

## What to Check Before Calling a Technician

### Step 1: Unplug the Fridge

Before cleaning or inspecting the rear or bottom area, unplug the refrigerator. This helps prevent electrical shock and keeps the condenser fan from running while you clean near it.

### Step 2: Clean the Condenser Coils

Locate the condenser coils. They are usually behind the lower front grille, underneath the fridge, or on the back of the fridge.

Use a vacuum with a brush attachment to remove dust, lint, and pet hair. A coil-cleaning brush can help reach deeper buildup.

### Step 3: Make Sure the Fridge Has Air Space

Do not push the refrigerator completely flush against the back wall.

The fridge needs space for air to move around the condenser area. If it is pressed tightly against the wall, heat may build up and cooling performance can suffer.

### Step 4: Check the Interior Vents

Make sure food containers are not blocking the air vents inside the refrigerator or freezer.

Blocked vents can stop cold air from circulating properly, making one section warm while another section stays cold.

### Step 5: Listen for Fans and Compressor Sounds

A normally operating refrigerator should have fan and compressor activity.

Listen for the evaporator fan inside the freezer, the condenser fan near the compressor, and the compressor humming from the back or bottom.

If the compressor clicks repeatedly but does not run, the start relay or capacitor may be bad. If the freezer is cold but the fridge is warm, the evaporator fan or airflow system may be the issue.

## Bottom Line

A fridge that is not cooling may have a simple maintenance issue or a major mechanical failure. Start by unplugging the fridge, vacuuming the condenser coils, clearing pet hair and dust, and making sure the unit is not pushed completely against the wall. If the refrigerator still does not cool after basic cleaning and airflow checks, the issue may be a failed fan, start relay, capacitor, compressor, or sealed-system leak.`,
  },
  {
    slug: "loud-banging-spin-cycle-diagnosis",
    title: "Spin Cycle Loud",
    description:
      "A loud washer spin cycle can be caused by a simple unbalanced load or a serious internal failure.",
    category: "Washer",
    symptoms: [
      "Loud banging during spin",
      "Roaring or jet-engine noise",
      "Washer walking or shaking",
      "Grinding or squealing",
    ],
    causes: [
      {
        item: "Unbalanced Load",
        cost: "Often $0 DIY",
        description: "Heavy items can bunch on one side and make the tub bang during high-speed spin.",
      },
      {
        item: "Broken or Worn Suspension Parts",
        cost: "$200-$350",
        description: "Worn rods, springs, or shock absorbers can let the tub bounce violently.",
      },
      {
        item: "Worn Tub Bearings",
        cost: "$400-$700+",
        description: "Roaring, grinding, or jet-engine noise usually points to bearing failure.",
      },
      {
        item: "Loose Pulley or Worn Belt",
        cost: "$120-$250",
        description: "A slipping belt or loose pulley can cause squealing, thumping, or vibration.",
      },
    ],
    articleMarkdown: `# Spin Cycle Loud

A loud washer spin cycle can be caused by a simple unbalanced load or a serious internal failure. The type of noise matters. A banging or thumping sound usually points to load balance or suspension problems, while a roaring, grinding, or jet-engine sound often points to worn tub bearings.

Before assuming the washer needs major repair, stop the cycle and check whether the load is unevenly distributed.

## Common Causes

### 1. Unbalanced Load

An unbalanced load is the simplest and most common reason a washer becomes loud during the spin cycle.

Heavy items like towels, blankets, comforters, rugs, or jeans can bunch up on one side of the drum. When the washer enters high-speed spin, the uneven weight causes the tub to shake, bang, or slam against the cabinet.

Signs of an unbalanced load include:

* Loud banging during spin
* Washer walking or shifting position
* Tub visibly shaking
* Noise happens only with large or heavy loads
* Washer stops and shows an unbalanced-load error
* Noise improves after redistributing clothes

This is usually not a mechanical failure unless the banging continues with normal loads.

### 2. Broken or Worn Suspension Rods or Shock Absorbers

Washers use suspension rods, springs, or shock absorbers to stabilize the tub during movement. If these parts wear out, the tub can bounce violently during the spin cycle.

Top-load washers commonly use suspension rods. Front-load washers usually use shock absorbers.

Signs of worn suspension parts include:

* Severe banging during spin
* Tub slams into the cabinet
* Washer shakes even with balanced loads
* Machine moves across the floor
* Drum feels loose or bouncy
* Noise gets worse over time

This repair is usually more affordable than tub bearing replacement and is often worth fixing if the washer is otherwise in good condition.

### 3. Worn Tub Bearings

Worn tub bearings are one of the more serious causes of a loud spin cycle.

The bearings support the washer drum as it spins. When they wear out, the spin cycle can become extremely loud. Many people describe the sound as roaring, grinding, rumbling, or like a jet engine.

Signs of worn tub bearings include:

* Loud roaring during high-speed spin
* Grinding or rumbling noise
* Noise gets louder as spin speed increases
* Drum may feel rough when turned by hand
* Drum may have excess play or wobble
* Water may leak from the rear bearing seal
* Brown or rusty stains near the back of the tub area

Bearing replacement is highly labor-intensive because the washer tub often has to be disassembled. On some models, the bearing is not sold separately and the entire tub assembly may need replacement.

This repair can be expensive enough that replacing the washer may be the better choice, especially on older machines.

### 4. Loose Motor Drive Pulley or Worn Belt

Some washers use a belt and pulley system to spin the drum. If the belt is worn, stretched, cracked, or slipping, it can cause squealing, thumping, or vibration during spin.

A loose motor pulley or drive pulley can also create noise.

Signs of pulley or belt problems include:

* Squealing during spin
* Burning rubber smell
* Washer struggles to reach full spin speed
* Thumping or rhythmic knocking
* Belt debris under the washer
* Spin cycle starts and stops irregularly

This type of repair is usually less expensive than bearing replacement.

## Typical Cost Breakdown

### Suspension Repair

Professional repair for worn suspension rods or shock absorbers usually costs:

**$200-$350**

This repair may include suspension rods, shock absorbers, springs, dampers, and labor to access and replace the parts.

This is a common repair when the washer makes a loud banging sound or shakes violently during spin.

### Bearing Repair

Professional repair for worn tub bearings usually costs:

**$400-$700+**

Bearing repairs are expensive because they often require major disassembly of the washer tub.

Costs can increase if the entire tub assembly must be replaced, the bearing is not sold separately, the washer is a front-load model, access is difficult, or additional seals are damaged.

For older washers, a bearing failure may mean replacement is more practical than repair.

## How to Identify the Noise

### Banging or Thumping

A loud banging sound usually points to:

* Unbalanced load
* Worn suspension rods
* Bad shock absorbers
* Washer not level
* Loose tub movement

Start by redistributing the load. If the banging happens with every load, the suspension system may be worn.

### Roaring or Jet-Engine Noise

A roaring sound during high-speed spin usually points to worn tub bearings, failing drum support, or bearing seal failure.

This is a more serious issue. If the washer sounds like an airplane taking off during spin, bearing failure is likely.

### Grinding

A grinding sound may point to worn bearings, a foreign object between tubs, a damaged pulley, or a motor or drive system issue.

Grinding should not be ignored, especially if it gets louder as the spin speed increases.

### Squealing

A squealing sound often points to a worn belt, slipping belt, pulley issue, or motor bearing issue.

This may be less severe than tub bearing failure, but it should still be inspected.

## What to Check Before Calling a Technician

### Step 1: Stop the Washer and Redistribute the Load

Pause the washer and spread the clothes evenly around the drum.

For bulky items like blankets or towels, avoid washing one heavy item by itself. Add similar items to balance the load.

### Step 2: Check That the Washer Is Level

A washer that is not level can shake and bang during spin.

Press down on opposite corners of the washer. If it rocks, adjust the leveling feet until the machine sits firmly on the floor.

### Step 3: Run a Small Test Load

Run a small, balanced load and listen.

If the washer is quiet with a small load but loud with bulky items, the issue may be load balance. If it bangs or roars with every load, a mechanical issue is more likely.

### Step 4: Spin the Drum by Hand

With the washer off, turn the drum by hand.

Listen for grinding, roughness, scraping, or rumbling.

If the drum feels rough or sounds like it is grinding, the bearings may be worn.

### Step 5: Check for Excess Drum Movement

Gently lift the inner drum up and down.

A small amount of movement can be normal, but excessive looseness, clunking, or wobbling may point to worn bearings, suspension problems, or tub support issues.

## Repair or Replace?

The sound can help determine whether the washer is worth fixing.

A banging sound is often caused by an unbalanced load or worn suspension parts. This is usually repairable at a moderate cost.

A roaring or grinding sound often points to worn tub bearings. Because bearing repair can cost **$400-$700+**, replacement may make more sense if the washer is older or has other problems.

## Bottom Line

A loud washer spin cycle is usually caused by either an unbalanced load, worn suspension parts, failing tub bearings, or a belt and pulley issue. Banging usually points to load balance or suspension problems. Roaring, grinding, or jet-engine noise usually points to bearing failure. Start by redistributing the load and leveling the washer. If the noise continues with normal loads, the washer likely needs mechanical repair.`,
  },
];
