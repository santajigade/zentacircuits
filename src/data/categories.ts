// The 12 segments. Colours pass 4.5:1 with white text. Icons are 24 px stroke paths.
export type Sub = { slug: string; name: string };
export type Category = { slug: string; name: string; short: string; color: string; desc: string; icon: string; subs: Sub[] };

const s = (list: string) => list.split('|').map((x) => { const [slug, name] = x.split(':'); return { slug, name }; });

export const CATEGORIES: Category[] = [
  { slug: 'basics', name: 'Basics', short: 'Basics', color: '#1D4ED8', desc: 'Voltage, current, Ohm and Kirchhoff laws, network theorems, AC and phasors.', icon: 'M5 20h4v-2a7 7 0 1 1 6 0v2h4',
    subs: s('quantities:Electrical quantities|laws:Circuit laws|network-analysis:Network analysis|theorems:Network theorems|ac-fundamentals:AC fundamentals|phasors-impedance:Phasors and impedance|ac-power:AC power|transients:Transients') },
  { slug: 'components', name: 'Components', short: 'Components', color: '#6D28D9', desc: 'Resistors, capacitors, diodes, BJTs, MOSFETs, op-amps, sensors and relays.', icon: 'M2 12h4l2-4 3 8 3-8 3 8 2-4h3',
    subs: s('passive:Passive components|magnetics:Magnetics|diodes:Diodes|transistors:Transistors|thyristors:Thyristors|ics:Integrated circuits|sensors:Sensors|displays:Displays|electromechanical:Electromechanical and timing') },
  { slug: 'analog', name: 'Analog Electronics', short: 'Analog', color: '#0E7490', desc: 'Rectifiers, amplifiers, biasing, feedback, oscillators, filters and regulators.', icon: 'M2 12q4-10 8 0t8 0q2 5 4 4',
    subs: s('diode-circuits:Diode circuits|bjt-amplifiers:BJT amplifiers|fet-amplifiers:FET amplifiers|power-amplifiers:Power amplifiers|feedback:Feedback|op-amp-circuits:Op-amp circuits|oscillators:Oscillators|filters:Filters|regulators:Regulators') },
  { slug: 'digital', name: 'Digital Electronics', short: 'Digital', color: '#15803D', desc: 'Number systems, gates, K maps, flip flops, counters, memories, ADC and DAC.', icon: 'M2 16h4V8h6v8h6V8h4',
    subs: s('number-systems:Number systems|logic-gates:Logic gates|boolean-algebra:Boolean algebra|combinational:Combinational circuits|sequential:Sequential circuits|counters-registers:Counters and registers|memories:Memories|logic-families:Logic families|data-conversion:ADC and DAC|state-machines:State machines') },
  { slug: 'embedded', name: 'Microcontrollers and Embedded', short: 'Embedded', color: '#A16207', desc: 'Arduino, ESP32, STM32, timers, interrupts, PWM, UART, SPI, I2C and CAN.', icon: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
    subs: s('basics:Microcontroller basics|arduino:Arduino|esp32:ESP32|stm32:STM32|peripherals:Peripherals|protocols:Communication protocols') },
  { slug: 'power-electronics', name: 'Power Electronics', short: 'Power', color: '#C2410C', desc: 'Rectifiers, buck and boost converters, inverters, SMPS and motor drives.', icon: 'M13 2L4 14h7l-1 8 9-12h-7z',
    subs: s('devices:Power devices|rectifiers:Controlled rectifiers|dc-dc-converters:DC-DC converters|inverters:Inverters|smps:SMPS|batteries:Battery charging|motor-drives:Motor drives') },
  { slug: 'communication', name: 'Communication Electronics', short: 'Communication', color: '#BE185D', desc: 'AM, FM and digital modulation, RF basics, antennas, wireless and IoT.', icon: 'M12 11v10M8 21h8M8.5 7.5a5 5 0 0 1 7 0M5.5 4.5a9 9 0 0 1 13 0',
    subs: s('analog-modulation:Analog modulation|digital-modulation:Digital modulation|rf-basics:RF basics|antennas:Antennas|wireless-iot:Wireless and IoT') },
  { slug: 'signals-systems', name: 'Signals, Systems and Control', short: 'Signals', color: '#4338CA', desc: 'Fourier, Laplace, sampling, DSP basics, Bode plots and PID control.', icon: 'M3 3v18h18M3 9h7c3 0 5 3 7 9',
    subs: s('signals:Signals|transforms:Transforms|sampling-dsp:Sampling and DSP|control:Control systems') },
  { slug: 'measurement', name: 'Measurement and Test', short: 'Measurement', color: '#0F766E', desc: 'Multimeter, oscilloscope, function generator and troubleshooting.', icon: 'M4 18a8 8 0 1 1 16 0M12 18l4-6M3 18h18',
    subs: s('instruments:Test instruments|troubleshooting:Troubleshooting') },
  { slug: 'pcb-design', name: 'PCB and Design', short: 'PCB', color: '#3F6212', desc: 'Schematics, layout, grounding, EMI and EMC, soldering and simulation tools.', icon: 'M4 4h16v16H4zM8 8v8h8M16 8v3M8 8h3',
    subs: s('schematic-layout:Schematic and layout|emi-emc:EMI and EMC|assembly:Soldering and assembly|tools:Design tools') },
  { slug: 'vlsi', name: 'VLSI and Semiconductors', short: 'VLSI', color: '#334155', desc: 'Device physics, CMOS, fabrication and Verilog basics.', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M7 9h10M7 12h10M7 15h10M9 7v10M12 7v10M15 7v10',
    subs: s('device-physics:Device physics|cmos:CMOS|fabrication:Fabrication|verilog:Verilog') },
  { slug: 'projects', name: 'Projects and Applications', short: 'Projects', color: '#B91C1C', desc: 'Beginner to advanced builds with circuits, code and test results.', icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z',
    subs: s('beginner:Beginner projects|intermediate:Intermediate projects|advanced:Advanced projects') },
];

export const catBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug)!;
export const subName = (cat: string, sub: string) => catBySlug(cat).subs.find((x) => x.slug === sub)?.name ?? sub;
