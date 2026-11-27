import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

export type InputsPestView =
  | 'dashboard'
  | 'catalog'
  | 'add_input'
  | 'input_detail'
  | 'pest_library'
  | 'add_pest'
  | 'guides_library'
  | 'add_guide'
  | 'create_guide' // alias for add_guide
  | 'pest_incidents'
  | 'incident_detail'
  | 'report_incident';

export interface IncidentHistoryItem {
  date: string;
  author: string;
  text: string;
}

export interface IncidentDetailData {
  incidentCode: string;
  reportedDate: string;
  farmer: string;
  farmPlot: string;
  crop: string;
  field: string;
  growthStage: string;
  farmerDescription: string;
  photos: string;
  pestOrDisease: string;
  severity: string;
  identificationNotes: string;
  linkedTreatmentGuide: string;
  followUpSubmitted: boolean;
  status: string;
  resolutionNotes: string;
  history: IncidentHistoryItem[];
}

export interface CatalogInputItem {
  id: string;
  name: string;
  code: string;
  type: string;
  category: string;
  manufacturer: string;
  applicableCrops: string;
  status: 'Approved' | 'Pending' | 'Inactive';
  updatedDate: string;
  updatedBy: string;
  dosage?: string;
  unit?: string;
  method?: string;
  frequency?: string;
  composition?: string;
  purpose?: string;
  restrictions?: string;
  referredPest?: string;
}

export interface PestRecordItem {
  id: string;
  commonName: string;
  scientificName: string;
  type: 'Pest' | 'Disease';
  affectedCrops: string;
  riskNotes: string;
  status: 'Published' | 'Draft' | 'Under Review';
  updatedDate: string;
  owner: string;
  riskLevel?: 'High' | 'Medium' | 'Low';
  symptoms?: string;
  organicTreatments?: string;
  prevention?: string;
}

export interface TreatmentGuideItem {
  id: string;
  title: string;
  guideType: 'Input Application' | 'Pest Treatment' | 'Soil Management';
  linkedInputPest: string;
  applicableCrops: string;
  version: string;
  status: 'Published' | 'Draft' | 'In Review' | 'Archived';
  lastUpdated: string;
}

export interface PestIncidentItem {
  id: string;
  incidentCode: string;
  farmer: string;
  cropLocation: string;
  pestOrDisease: string;
  severity: 'High' | 'Medium' | 'Low';
  reportedDate: string;
  status: 'Ongoing' | 'Resolved' | 'Under Review' | 'Pending';
  resolvedDate?: string;
}

@Component({
  selector: 'app-inputs-pest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inputs-pest.component.html',
  styleUrls: ['./inputs-pest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputsPestComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly currentView = signal<InputsPestView>('dashboard');
  readonly activeInput = signal<CatalogInputItem | null>(null);
  readonly selectedInputModal = signal<CatalogInputItem | null>(null);
  readonly selectedHistoryItem = signal<CatalogInputItem | null>(null);
  readonly selectedPestModal = signal<PestRecordItem | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // Filters for Catalog
  searchQuery = '';
  typeFilter = 'All Types';
  statusFilter = 'All Statuses';

  // Filters for Pest Library
  pestSearchQuery = '';

  // Filters for Guides Library (Image 2)
  guidesSearchQuery = '';
  guidePage = signal<number>(1);
  readonly guidesPerPage = 6;

  // Filters for Incidents (Image 5)
  incidentsSearchQuery = '';
  readonly selectedIncidentModal = signal<PestIncidentItem | null>(null);

  // Incident Detail Model & Modals (Images 1, 2, 3, 4 of latest turn)
  readonly activeIncident = signal<IncidentDetailData>({
    incidentCode: 'PI-2026-0007',
    reportedDate: '13 Oct 2026, 08:30',
    farmer: 'Ramesh Kumar',
    farmPlot: 'PLT-00124-1',
    crop: 'Tomato',
    field: 'Field 1',
    growthStage: 'Not provided',
    farmerDescription: 'Demo farmer report (placeholder).',
    photos: 'None uploaded',
    pestOrDisease: 'Not linked',
    severity: 'Medium',
    identificationNotes: '—',
    linkedTreatmentGuide: 'None linked',
    followUpSubmitted: false,
    status: 'Ongoing',
    resolutionNotes: '—',
    history: [
      {
        date: '13 Oct 2026, 08:30',
        author: 'Ramesh Kumar',
        text: 'Reported: Incident reported by the farmer',
      },
    ],
  });

  readonly linkPestModalOpen = signal<boolean>(false);
  readonly linkGuideModalOpen = signal<boolean>(false);
  readonly recordNoteModalOpen = signal<boolean>(false);
  readonly historyModalIncident = signal<PestIncidentItem | null>(null);

  selectedPestToLink = '';
  reviewNoteText = '';

  newIncident = {
    farmer: 'Ramesh Kumar',
    crop: 'Tomato',
    farmPlot: 'PLT-00124-1',
    growthStage: '6. Crop development',
    pestOrDisease: 'Late Blight',
    severity: 'Medium' as 'Low' | 'Medium' | 'High',
    affectedParts: 'Leaves, Stem',
    description: '',
    urgency: 'Normal',
    preliminaryAction: 'Immediate foliar spray of Neem Oil (5ml/L)',
  };

  // New Input Form Model (Images 3 & 4 of previous turn)
  newInput = {
    name: '',
    referredPest: '',
    category: '',
    manufacturer: '',
    productId: '',
    description: '',
    validityDate: '',
    composition: '',
    purpose: '',
    applicableCrops: '',
    dosage: '',
    unit: '',
    method: '',
    frequency: '',
    restrictions: '',
  };

  // New Pest/Disease Form Model (Images 1 & 2 of latest turn)
  newPest = {
    commonName: '',
    scientificName: '',
    type: 'Disease' as 'Pest' | 'Disease',
    description: '',
    verificationSource: '',
    applicableCrops: '',
    affectedParts: '',
    visibleSymptoms: '',
    indicators: '',
    lookalikes: '',
    seasonalRiskPeriod: '',
    growingConditions: '',
    weatherRisk: '',
    severityGuidance: '',
    preventivePractices: '',
    linkedOrganicTreatment: '',
    relevantGuide: '',
    safetyPrecautions: '',
  };

  // New Guide Form Model (Images 3 & 4 of latest turn)
  newGuideForm = {
    title: '',
    guideType: '',
    linkedInput: '',
    linkedPest: '',
    applicableCrops: '',
    growingStage: '',
    precautions: '',
    restrictions: '',
    method: '',
    instructions: '',
    dosage: '',
    unit: '',
    timing: '',
    references: '',
    changeSummary: '',
  };

  // Default Catalog Inputs matching Image 1 & 2 & 3
  catalogInputs: CatalogInputItem[] = [
    {
      id: 'IN-0041',
      name: 'Neem Oil Concentrate',
      code: 'IN-0041',
      type: 'Pest control',
      category: 'Pest control',
      manufacturer: 'GreenGro Organics',
      applicableCrops: 'Tomato, Cabbage',
      status: 'Approved',
      updatedDate: '11 Oct 2026',
      updatedBy: 'Priya Nair',
      dosage: '5',
      unit: 'ml / L',
      method: 'Foliar spray, every 10 days',
      frequency: 'Every 10 days',
      composition: 'Azadirachtin 1500 ppm',
      purpose: 'Control of aphids, whiteflies, thrips, and early fungal spores on horticultural crops.',
      restrictions: 'Do not apply in direct sunlight or when temperatures exceed 32°C. Keep away from water bodies.',
      referredPest: 'Aphids, Whiteflies & Mildew',
    },
    {
      id: 'IN-0055',
      name: 'Panchagavya Mix',
      code: 'IN-0055',
      type: 'Soil Input',
      category: 'Soil Input',
      manufacturer: 'Farmer-prepared',
      applicableCrops: 'All crops',
      status: 'Pending',
      updatedDate: '10 Oct 2026',
      updatedBy: 'Priya Nair',
      dosage: '30',
      unit: 'ml / L',
      method: 'Soil drenching and foliar nutrition spray',
      frequency: 'Every 14 days during vegetative growth',
      composition: 'Desi cow dung, cow urine, milk, curd, ghee, jaggery, tender coconut water, and banana.',
      purpose: 'Enhance beneficial soil microbial activity, plant immunity, and crop vigour.',
      restrictions: 'Use fermented solution within 30 days of preparation.',
      referredPest: 'Soil Nutrition Deficiency & Weak Immunity',
    },
    {
      id: 'IN-0012',
      name: 'Vermicompost Grade A',
      code: 'IN-0012',
      type: 'Soil input',
      category: 'Soil input',
      manufacturer: 'Local supplier',
      applicableCrops: '—',
      status: 'Inactive',
      updatedDate: '2 Jun 2026',
      updatedBy: 'Historical record',
      dosage: '2',
      unit: 'tons / acre',
      method: 'Basal soil incorporation during field preparation',
      frequency: 'Once before planting cycle',
      composition: 'Eisenia fetida worm castings, aged farmyard manure, enriched organic humic substances.',
      purpose: 'Soil structure improvement, moisture retention, and slow-release organic NPK.',
      restrictions: 'Store in shaded dry condition; do not allow complete desiccation.',
      referredPest: 'Soil Structure Degradation',
    },
    {
      id: 'IN-0028',
      name: 'Trichoderma Viride',
      code: 'IN-0028',
      type: 'Biocontrol',
      category: 'Biocontrol',
      manufacturer: 'BioShield India',
      applicableCrops: 'Tomato, Potato, Carrot',
      status: 'Approved',
      updatedDate: '28 Sep 2026',
      updatedBy: 'Priya Nair',
      dosage: '5',
      unit: 'g / L',
      method: 'Seed treatment, soil drenching, or nursery bed application',
      frequency: 'At planting and 30 days post-germination',
      composition: 'Trichoderma viride 2x10^9 CFU/g wettable carrier formulation.',
      purpose: 'Bio-fungicide antagonist for Rhizoctonia, Fusarium, and Pythium root rots.',
      restrictions: 'Incompatible with synthetic copper fungicides within 5 days of application.',
      referredPest: 'Damping-off & Root Rot',
    },
    {
      id: 'IN-0033',
      name: 'Pseudomonas Fluorescens',
      code: 'IN-0033',
      type: 'Biocontrol',
      category: 'Biocontrol',
      manufacturer: 'GreenBio Tech',
      applicableCrops: 'Vegetables',
      status: 'Approved',
      updatedDate: '20 Sep 2026',
      updatedBy: 'Priya Nair',
      dosage: '10',
      unit: 'g / L',
      method: 'Foliar spray and root dip before transplanting',
      frequency: 'Bi-weekly preventive spray',
      composition: 'Pseudomonas fluorescens 1x10^9 CFU/g carrier formulation.',
      purpose: 'Suppression of bacterial wilt, leaf spots, and promotion of plant growth hormones.',
      restrictions: 'Store in cool place under 25°C away from direct sunlight.',
      referredPest: 'Bacterial Wilt & Leaf Spot',
    },
    {
      id: 'IN-0062',
      name: 'Jeevamrutha Concentrate',
      code: 'IN-0062',
      type: 'Soil Input',
      category: 'Soil Input',
      manufacturer: 'Farmer-prepared',
      applicableCrops: 'All crops',
      status: 'Approved',
      updatedDate: '15 Sep 2026',
      updatedBy: 'Priya Nair',
      dosage: '200',
      unit: 'L / acre',
      method: 'Drip fertigation or field flood channel inoculation',
      frequency: 'Every 15-20 days throughout season',
      composition: 'Fresh cow dung, cow urine, pulse flour, native fertile virgin soil, and jaggery.',
      purpose: 'Stimulate indigenous earthworms and multiply beneficial mycorrhizal fungi.',
      restrictions: 'Stir twice daily during 48-hour fermentation cycle before field release.',
      referredPest: 'Soil Microbe Depletion',
    },
    {
      id: 'IN-0049',
      name: 'Dashaparni Kashayam',
      code: 'IN-0049',
      type: 'Pest control',
      category: 'Pest control',
      manufacturer: 'Farmer-prepared',
      applicableCrops: 'Tomato, Beans',
      status: 'Approved',
      updatedDate: '10 Sep 2026',
      updatedBy: 'Priya Nair',
      dosage: '20',
      unit: 'ml / L',
      method: 'Foliar canopy spray',
      frequency: 'Every 10 days during pest infestation',
      composition: 'Extract of 10 bitter and astringent herbal leaves, cow urine, ginger, and green chilli.',
      purpose: 'Broad spectrum herbal insect repellent against borer caterpillars and sucking pests.',
      restrictions: 'Wear mask during preparation and spraying; causes skin tingling if concentrated.',
      referredPest: 'Fruit Borer & Caterpillars',
    },
    {
      id: 'IN-0051',
      name: 'Agniastra Extract',
      code: 'IN-0051',
      type: 'Pest control',
      category: 'Pest control',
      manufacturer: 'Nilgiri Organics',
      applicableCrops: 'Cabbage, Cauliflower',
      status: 'Approved',
      updatedDate: '1 Sep 2026',
      updatedBy: 'Priya Nair',
      dosage: '25',
      unit: 'ml / L',
      method: 'Targeted spray on undersides of leaves',
      frequency: 'Apply on first pest sighting; repeat after 5 days if required',
      composition: 'Decoction of herbal leaves, hot chilli, garlic, and cow urine.',
      purpose: 'Eradication of stubborn leaf webbers, diamondback moth, and pod borers.',
      restrictions: 'Do not harvest produce within 48 hours of spray (2-day PHI).',
      referredPest: 'Diamondback Moth & Leaf Webber',
    },
    {
      id: 'IN-0019',
      name: 'Neem Cake Organic Powder',
      code: 'IN-0019',
      type: 'Soil Input',
      category: 'Soil Input',
      manufacturer: 'PureAgro Kerala',
      applicableCrops: 'All crops',
      status: 'Approved',
      updatedDate: '25 Aug 2026',
      updatedBy: 'Priya Nair',
      dosage: '100',
      unit: 'kg / acre',
      method: 'Soil broadcast and shallow hoeing around root zone',
      frequency: 'At planting and prior to flowering stage',
      composition: '100% de-oiled neem kernel cake meal with residual azadirachtin 1000 PPM.',
      purpose: 'Nematode control in soil and nitrification inhibitor for organic nitrogen retention.',
      restrictions: 'Ensure uniform soil moisture following application.',
      referredPest: 'Root-Knot Nematodes',
    },
    {
      id: 'IN-0015',
      name: 'Bone Meal Steamed',
      code: 'IN-0015',
      type: 'Soil Input',
      category: 'Soil Input',
      manufacturer: 'AgriNutrient Corp',
      applicableCrops: 'Root crops',
      status: 'Approved',
      updatedDate: '12 Aug 2026',
      updatedBy: 'Priya Nair',
      dosage: '50',
      unit: 'kg / acre',
      method: 'Band placement near roots',
      frequency: 'Single application during planting or tuber formation',
      composition: 'Steamed ground animal bones with 3% Nitrogen, 20% Available P2O5, and 24% Calcium.',
      purpose: 'Rich source of slow-release phosphorus and calcium for carrot/potato tuber expansion.',
      restrictions: 'Organic certified source only; keep out of reach of livestock animals.',
      referredPest: 'Phosphorus & Calcium Deficiency',
    },
    {
      id: 'IN-0037',
      name: 'Beauveria Bassiana',
      code: 'IN-0037',
      type: 'Biocontrol',
      category: 'Biocontrol',
      manufacturer: 'EcoProtect Lab',
      applicableCrops: 'Vegetables, Fruits',
      status: 'Approved',
      updatedDate: '5 Aug 2026',
      updatedBy: 'Priya Nair',
      dosage: '5',
      unit: 'g / L',
      method: 'Foliar spray with biological sticker',
      frequency: 'Every 7 days during high humidity or pest outbreak',
      composition: 'Entomopathogenic fungus Beauveria bassiana spores (min. 1x10^8 CFU/g).',
      purpose: 'Parasitic eradication of whiteflies, thrips, aphids, and beetles by spore penetration.',
      restrictions: 'Avoid mixing with chemical fungicides or sulfur compounds.',
      referredPest: 'Whiteflies & Thrips',
    },
    {
      id: 'IN-0070',
      name: 'Bio-NPK Liquid',
      code: 'IN-0070',
      type: 'Bio-fertilizer',
      category: 'Bio-fertilizer',
      manufacturer: 'GrowMore Organics',
      applicableCrops: 'All crops',
      status: 'Pending',
      updatedDate: '14 Oct 2026',
      updatedBy: 'Priya Nair',
      dosage: '5',
      unit: 'ml / L',
      method: 'Foliar and drip fertigation',
      frequency: 'Every 15 days',
      composition: 'Nitrogen-fixing, Phosphate-solubilizing, and Potash-mobilizing bacterial consortium.',
      purpose: 'Supply essential macronutrients in bioavailable ionic form.',
      restrictions: 'Requires complete composition lab certificate before publication.',
      referredPest: 'Macronutrient Deficiency',
    },
    {
      id: 'IN-0008',
      name: 'Copper Hydroxide 77% WP',
      code: 'IN-0008',
      type: 'Fungicide',
      category: 'Pest control',
      manufacturer: 'Nilgiri Agro',
      applicableCrops: 'Potato, Tomato',
      status: 'Inactive',
      updatedDate: '15 Jul 2026',
      updatedBy: 'Historical record',
      dosage: '2',
      unit: 'g / L',
      method: 'Foliar spray with protective equipment',
      frequency: 'Only when severe late blight conditions are forecasted',
      composition: 'Copper Hydroxide 77% WP (Metallic Copper 50%).',
      purpose: 'Emergency preventive broad-spectrum bactericide and contact fungicide.',
      restrictions: 'Requires special exemption certificate under NPOP organic guidelines.',
      referredPest: 'Late Blight (Tomato & Potato)',
    },
    {
      id: 'IN-0065',
      name: 'Fish Amino Acid (FAA)',
      code: 'IN-0065',
      type: 'Plant booster',
      category: 'Plant booster',
      manufacturer: 'Coastal Bio',
      applicableCrops: 'All crops',
      status: 'Approved',
      updatedDate: '28 Jun 2026',
      updatedBy: 'Priya Nair',
      dosage: '5',
      unit: 'ml / L',
      method: 'Foliar spray during vegetative and flowering initiation',
      frequency: 'Every 14 days',
      composition: 'Cold fermented whole marine fish protein hydrolysate with brown sugar.',
      purpose: 'Supply organic nitrogen, trace amino acids, and promote vibrant green leaf canopy.',
      restrictions: 'Filter thoroughly before filling spray nozzles to prevent clogging.',
      referredPest: 'Vegetative Stunting',
    },
    {
      id: 'IN-0068',
      name: 'Egg Amino Acid (EAA)',
      code: 'IN-0068',
      type: 'Plant booster',
      category: 'Plant booster',
      manufacturer: 'Farmer-prepared',
      applicableCrops: 'Tomato, Chilli',
      status: 'Approved',
      updatedDate: '18 Jun 2026',
      updatedBy: 'Priya Nair',
      dosage: '5',
      unit: 'ml / L',
      method: 'Foliar spray at early fruit setting',
      frequency: 'Twice during fruit expansion phase',
      composition: 'Whole country chicken eggs dissolved in pure lemon juice and aged with jaggery syrup.',
      purpose: 'Increase flower retention, enhance fruit size, and prevent blossom end rot via organic calcium.',
      restrictions: 'Do not spray during high afternoon temperatures.',
      referredPest: 'Flower Drop & Calcium Deficiency',
    },
  ];

  // 11 Pest & Disease Records matching Image 4 (SA-M6-S01d)
  pestLibrary: PestRecordItem[] = [
    {
      id: 'PEST-001',
      commonName: 'Late Blight',
      scientificName: 'Phytophthora infestans',
      type: 'Disease',
      affectedCrops: 'Tomato, Potato',
      riskNotes: 'Risk: Jun-Sep (high humidity)',
      status: 'Published',
      updatedDate: '9 Oct 2026',
      owner: 'Agronomy team',
      symptoms: 'Pale green, water-soaked spots on leaves turning brown-black rapidly with white fungal growth underneath during damp weather.',
      organicTreatments: 'Trichoderma viride foliar spray (5g/L), Copper hydroxide emergency barrier (2g/L), or Bordeaux mixture (1%).',
      prevention: 'Wide row spacing (60cm+), drip irrigation, clean certified disease-free seedlings, and strict Solanaceae crop rotation.',
    },
    {
      id: 'PEST-002',
      commonName: 'Aphid Infestation',
      scientificName: 'Aphidoidea spp.',
      type: 'Pest',
      affectedCrops: 'Cabbage, Beans',
      riskNotes: 'Seasonal risk not yet verified',
      status: 'Draft',
      updatedDate: '7 Oct 2026',
      owner: 'Field Extension Team',
      symptoms: 'Curled and puckered leaves, sticky honeydew excretions, black sooty mould covering upper leaf surfaces.',
      organicTreatments: 'Neem Oil Concentrate (5ml/L) with soap sticker, or 5% neem seed kernel extract (NSKE).',
      prevention: 'Yellow sticky cards (10/acre), conservation of ladybird beetles, and avoid excessive nitrogen application.',
    },
    {
      id: 'PEST-003',
      commonName: 'Early Blight',
      scientificName: 'Alternaria solani',
      type: 'Disease',
      affectedCrops: 'Tomato, Potato',
      riskNotes: 'Risk: Jul-Sep (monsoon)',
      status: 'Published',
      updatedDate: '5 Oct 2026',
      owner: 'Agronomy team',
      symptoms: 'Concentric dark rings (target board pattern) on older leaves with yellow halos, drying and premature defoliation.',
      organicTreatments: 'Neem Oil Concentrate (5ml/L) alternating with Pseudomonas fluorescens (10g/L).',
      prevention: 'Avoid overhead sprinkler watering; remove bottom leaves touching damp soil; maintain balanced organic nutrition.',
    },
    {
      id: 'PEST-004',
      commonName: 'Powdery Mildew',
      scientificName: 'Erysiphales',
      type: 'Disease',
      affectedCrops: 'Beans, Pea',
      riskNotes: 'Risk: Oct-Dec (cool nights)',
      status: 'Published',
      updatedDate: '2 Oct 2026',
      owner: 'Field Extension Team',
      symptoms: 'White powdery fungal patches on upper leaf surfaces, curling of young leaves, and reduced pod set.',
      organicTreatments: 'Sour buttermilk solution (100ml/L) or baking soda spray (5g/L) with horticultural soap.',
      prevention: 'Ensure morning sunlight on crop rows; prune dense foliage to encourage constant mountain air draft.',
    },
    {
      id: 'PEST-005',
      commonName: 'Diamondback Moth',
      scientificName: 'Plutella xylostella',
      type: 'Pest',
      affectedCrops: 'Cabbage, Cauliflower',
      riskNotes: 'Risk: Year-round (peak summer)',
      status: 'Published',
      updatedDate: '28 Sep 2026',
      owner: 'Agronomy team',
      symptoms: 'Window pane damage on lower leaf surface, silken threads, and small greenish caterpillars eating inner leaves.',
      organicTreatments: 'Agniastra Extract (25ml/L) or Bacillus thuringiensis (Bt) foliar spray (2g/L).',
      prevention: 'Trap crop mustard rows around cabbage beds; pheromone traps (5 per acre); release of Trichogramma egg parasitoids.',
    },
    {
      id: 'PEST-006',
      commonName: 'Carrot Rust Fly',
      scientificName: 'Psila rosae',
      type: 'Pest',
      affectedCrops: 'Carrot',
      riskNotes: 'Risk: Aug-Nov (damp soil)',
      status: 'Draft',
      updatedDate: '22 Sep 2026',
      owner: 'Agronomy team',
      symptoms: 'Rusty brown tunnels in root taproots, wilting and bronzing of foliage tops.',
      organicTreatments: 'Neem Cake soil incorporation (100kg/acre) and entomopathogenic nematodes.',
      prevention: 'Physical insect mesh covers (height 60cm); intercropping with aromatic onions or garlic to confuse adult flies.',
    },
    {
      id: 'PEST-007',
      commonName: 'Fruit Borer',
      scientificName: 'Helicoverpa armigera',
      type: 'Pest',
      affectedCrops: 'Tomato',
      riskNotes: 'Risk: Flowering & fruiting',
      status: 'Published',
      updatedDate: '18 Sep 2026',
      owner: 'Field Extension Team',
      symptoms: 'Circular holes bored into ripening fruits with fecal matter near calyx; damaged fruits drop or rot prematurely.',
      organicTreatments: 'Dashaparni Kashayam (20ml/L), HaNPV viral bio-pesticide, or Beauveria bassiana (5g/L).',
      prevention: 'African marigold border trap crops (1 marigold row for every 16 tomato rows); bird perches (10 per acre).',
    },
    {
      id: 'PEST-008',
      commonName: 'Damping-off',
      scientificName: 'Pythium & Rhizoctonia',
      type: 'Disease',
      affectedCrops: 'All vegetable nurseries',
      riskNotes: 'Risk: Nursery seedling stage',
      status: 'Published',
      updatedDate: '14 Sep 2026',
      owner: 'Agronomy team',
      symptoms: 'Water-soaked constriction at seedling collar region followed by toppling over and death of young plantlets.',
      organicTreatments: 'Trichoderma viride seed coating (10g/kg) and nursery bed soil solarization.',
      prevention: 'Raised nursery seedbeds with sand/compost drainage; avoid overwatering in cold mountain mornings.',
    },
    {
      id: 'PEST-009',
      commonName: 'Whitefly',
      scientificName: 'Bemisia tabaci',
      type: 'Pest',
      affectedCrops: 'Tomato, Chilli, Beans',
      riskNotes: 'Risk: Dry warm periods',
      status: 'Published',
      updatedDate: '10 Sep 2026',
      owner: 'Field Extension Team',
      symptoms: 'Minute white flies fluttering when foliage is disturbed; leaf curl virus transmission; sooty mould.',
      organicTreatments: 'Beauveria bassiana (5g/L) alternating with yellow sticky traps and Neem Oil (5ml/L).',
      prevention: 'Border barriers of tall maize or sorghum to impede wind-drift of adult whiteflies.',
    },
    {
      id: 'PEST-010',
      commonName: 'Root-Knot Nematode',
      scientificName: 'Meloidogyne spp.',
      type: 'Pest',
      affectedCrops: 'Carrot, Potato, Tomato',
      riskNotes: 'Risk: Continuous cropping',
      status: 'Published',
      updatedDate: '5 Sep 2026',
      owner: 'Agronomy team',
      symptoms: 'Distinct galls and swelling on root systems, stunted yellowing top growth resembling moisture/nutrient deficiency.',
      organicTreatments: 'Pochonia chlamydosporia bio-nematicide and dense marigold green manuring.',
      prevention: 'Crop rotation with non-host cereals; incorporate 200kg/acre of neem cake powder before planting.',
    },
    {
      id: 'PEST-011',
      commonName: 'Bacterial Wilt',
      scientificName: 'Ralstonia solanacearum',
      type: 'Disease',
      affectedCrops: 'Tomato, Potato',
      riskNotes: 'Risk: Heavy monsoon waterlogging',
      status: 'Published',
      updatedDate: '1 Sep 2026',
      owner: 'Agronomy team',
      symptoms: 'Rapid daytime wilting of entire plant while leaves remain green; white bacterial stream oozes from cut stem in water.',
      organicTreatments: 'Pseudomonas fluorescens root dip (10g/L) and soil drenching with fresh bleaching powder (3kg/acre).',
      prevention: 'Strict soil liming to maintain pH > 6.5; field drainage trenches; avoid working wet fields during active wilting.',
    },
  ];

  // Application & Treatment Guides (Image 2)
  treatmentGuides: TreatmentGuideItem[] = [
    {
      id: 'GD-001',
      title: 'Neem Oil – Foliar Spray Guide',
      guideType: 'Input Application',
      linkedInputPest: 'Neem Oil Concentrate',
      applicableCrops: 'Tomato, Cabbage',
      version: 'v2',
      status: 'Published',
      lastUpdated: '11 Oct 2026',
    },
    {
      id: 'GD-002',
      title: 'Late Blight – Organic Treatment',
      guideType: 'Pest Treatment',
      linkedInputPest: 'Late Blight',
      applicableCrops: 'Tomato, Potato',
      version: '—',
      status: 'Draft',
      lastUpdated: '7 Oct 2026',
    },
    {
      id: 'GD-003',
      title: 'Aphid Control – Biological Management',
      guideType: 'Input Application',
      linkedInputPest: 'Neem Oil Concentrate, Soap Solution',
      applicableCrops: 'Cabbage, Beans',
      version: 'v1',
      status: 'In Review',
      lastUpdated: '9 Oct 2026',
    },
    {
      id: 'GD-004',
      title: 'Powdery Mildew – Organic Treatment',
      guideType: 'Pest Treatment',
      linkedInputPest: 'Powdery Mildew',
      applicableCrops: 'Cucumber, Tomato',
      version: 'v1',
      status: 'Published',
      lastUpdated: '28 Sep 2026',
    },
    {
      id: 'GD-005',
      title: 'Fruit Borer – Integrated Management',
      guideType: 'Pest Treatment',
      linkedInputPest: 'Fruit Borer',
      applicableCrops: 'Tomato, Brinjal',
      version: 'v1',
      status: 'Archived',
      lastUpdated: '15 Aug 2026',
    },
    {
      id: 'GD-006',
      title: 'Soil Amendment – Organic Guide',
      guideType: 'Input Application',
      linkedInputPest: 'Compost, Jeevamrutham',
      applicableCrops: 'All Crops',
      version: 'v2',
      status: 'Published',
      lastUpdated: '2 Aug 2026',
    },
    {
      id: 'GD-007',
      title: 'Trichoderma Soil Inoculation Protocol',
      guideType: 'Input Application',
      linkedInputPest: 'Trichoderma Viride',
      applicableCrops: 'Potato, Carrot',
      version: 'v1',
      status: 'Published',
      lastUpdated: '18 Jul 2026',
    },
    {
      id: 'GD-008',
      title: 'Bordeaux Mixture Preparation Guide',
      guideType: 'Input Application',
      linkedInputPest: 'Copper Sulfate, Lime',
      applicableCrops: 'Tomato, Grapes',
      version: 'v1',
      status: 'Published',
      lastUpdated: '10 Jul 2026',
    },
    {
      id: 'GD-009',
      title: 'Agniastra Pest Repellent Guide',
      guideType: 'Input Application',
      linkedInputPest: 'Agniastra Extract',
      applicableCrops: 'Cabbage, Chilli',
      version: 'v1',
      status: 'Published',
      lastUpdated: '1 Jul 2026',
    },
    {
      id: 'GD-010',
      title: 'Damping Off Prevention Protocol',
      guideType: 'Pest Treatment',
      linkedInputPest: 'Pythium spp.',
      applicableCrops: 'All Nursery Beds',
      version: 'v1',
      status: 'Published',
      lastUpdated: '22 Jun 2026',
    },
    {
      id: 'GD-011',
      title: 'Fruit Fly Trapping & Bait Protocol',
      guideType: 'Pest Treatment',
      linkedInputPest: 'Bactrocera dorsalis',
      applicableCrops: 'Fruit Crops',
      version: 'v1',
      status: 'Published',
      lastUpdated: '15 Jun 2026',
    },
  ];

  // Farm Pest Incidents in Nilgiris (Image 5)
  pestIncidents: PestIncidentItem[] = [
    {
      id: 'PI-0121',
      incidentCode: 'PI-0121',
      farmer: 'Ramesh Kumar',
      cropLocation: 'Tomato - Coonoor - plot 1',
      pestOrDisease: 'Late Blight',
      severity: 'Medium',
      reportedDate: 'Today',
      status: 'Ongoing',
    },
    {
      id: 'PI-0120',
      incidentCode: 'PI-0120',
      farmer: 'Ramesh Kumar',
      cropLocation: 'Tomato - Coonoor - plot 1',
      pestOrDisease: 'Unverified Pest',
      severity: 'Medium',
      reportedDate: 'Today',
      status: 'Ongoing',
    },
    {
      id: 'PI-0101',
      incidentCode: 'PI-0101',
      farmer: 'Ramesh Kumar',
      cropLocation: 'Tomato - Coonoor - plot 1',
      pestOrDisease: 'Late Blight',
      severity: 'High',
      reportedDate: '12 Oct 2026',
      status: 'Ongoing',
    },
    {
      id: 'PI-0097',
      incidentCode: 'PI-0097',
      farmer: 'Selvi',
      cropLocation: 'Cabbage - Coonoor - plot 2',
      pestOrDisease: 'Aphid Infestation',
      severity: 'Medium',
      reportedDate: '3 Oct 2026',
      status: 'Resolved',
      resolvedDate: '8 Oct 2026',
    },
    {
      id: 'PI-0102',
      incidentCode: 'PI-0102',
      farmer: 'Arun Raj',
      cropLocation: 'Potato - Kotagiri - plot 3',
      pestOrDisease: 'Early Blight',
      severity: 'Medium',
      reportedDate: '11 Oct 2026',
      status: 'Under Review',
    },
    {
      id: 'PI-0103',
      incidentCode: 'PI-0103',
      farmer: 'Meena',
      cropLocation: 'Beans - Ooty - plot 4',
      pestOrDisease: 'Leaf Spot',
      severity: 'Medium',
      reportedDate: '10 Oct 2026',
      status: 'Ongoing',
    },
    {
      id: 'PI-0104',
      incidentCode: 'PI-0104',
      farmer: 'Vijay',
      cropLocation: 'Cabbage - Koonur - plot 1',
      pestOrDisease: 'Caterpillar',
      severity: 'High',
      reportedDate: '9 Oct 2026',
      status: 'Ongoing',
    },
    {
      id: 'PI-0105',
      incidentCode: 'PI-0105',
      farmer: 'Sundar',
      cropLocation: 'Tomato - Ooty - plot 2',
      pestOrDisease: 'Whitefly',
      severity: 'Low',
      reportedDate: '8 Oct 2026',
      status: 'Resolved',
      resolvedDate: '10 Oct 2026',
    },
    {
      id: 'PI-0106',
      incidentCode: 'PI-0106',
      farmer: 'Kumar',
      cropLocation: 'Brinjal - Coonoor - plot 5',
      pestOrDisease: 'Fruit Borer',
      severity: 'Medium',
      reportedDate: '7 Oct 2026',
      status: 'Under Review',
    },
    {
      id: 'PI-0107',
      incidentCode: 'PI-0107',
      farmer: 'Latha',
      cropLocation: 'Chilli - Kotagiri - plot 1',
      pestOrDisease: 'Thrips',
      severity: 'Low',
      reportedDate: '6 Oct 2026',
      status: 'Resolved',
      resolvedDate: '8 Oct 2026',
    },
    {
      id: 'PI-0108',
      incidentCode: 'PI-0108',
      farmer: 'Ravi',
      cropLocation: 'Cucumber - Ooty - plot 3',
      pestOrDisease: 'Powdery Mildew',
      severity: 'Medium',
      reportedDate: '5 Oct 2026',
      status: 'Pending',
    },
  ];

  ngOnInit(): void {
    // Default to Neem Oil Concentrate for detail view
    this.activeInput.set(this.catalogInputs[0] ?? null);

    this.route.queryParams.subscribe((params) => {
      if (params['view'] === 'catalog') {
        this.currentView.set('catalog');
      } else if (params['view'] === 'add_input') {
        this.currentView.set('add_input');
      } else if (params['view'] === 'input_detail') {
        this.currentView.set('input_detail');
        if (params['inputId']) {
          const item = this.catalogInputs.find((c) => c.id === params['inputId']);
          if (item) {
            this.activeInput.set(item);
          }
        }
      } else if (params['view'] === 'pest_library') {
        this.currentView.set('pest_library');
      } else if (params['view'] === 'add_pest') {
        this.currentView.set('add_pest');
      } else if (params['view'] === 'guides_library' || params['view'] === 'guides') {
        this.currentView.set('guides_library');
      } else if (params['view'] === 'add_guide' || params['view'] === 'create_guide') {
        this.currentView.set('add_guide');
      } else if (params['view'] === 'pest_incidents') {
        this.currentView.set('pest_incidents');
      } else if (params['view'] === 'report_incident') {
        this.currentView.set('report_incident');
      } else if (params['view'] === 'incident_detail') {
        this.currentView.set('incident_detail');
        if (params['incidentId']) {
          const inc = this.pestIncidents.find((i) => i.incidentCode === params['incidentId']);
          if (inc) {
            this.activeIncident.update((curr) => ({
              ...curr,
              incidentCode: inc.incidentCode,
              farmer: inc.farmer,
              crop: inc.cropLocation.split(' - ')[0] || 'Tomato',
              farmPlot: inc.cropLocation.split(' - ')[2] || 'PLT-00124-1',
              field: inc.cropLocation.split(' - ')[2] || 'Field 1',
              pestOrDisease: inc.pestOrDisease || 'Not linked',
              severity: inc.severity,
              status: inc.status,
            }));
          }
        }
      } else {
        this.currentView.set('dashboard');
      }
    });
  }

  // Navigation helpers
  navigateTo(view: InputsPestView, inputId?: string, incidentId?: string): void {
    this.currentView.set(view);
    const queryParams: Record<string, string> = { view };
    if (inputId) {
      queryParams['inputId'] = inputId;
    }
    if (incidentId) {
      queryParams['incidentId'] = incidentId;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  openInputDetail(item?: CatalogInputItem | null): void {
    if (item) {
      this.activeInput.set(item);
      this.navigateTo('input_detail', item.id);
    }
  }

  openInputByIndex(index: number): void {
    const item = this.catalogInputs[index];
    if (item) {
      this.openInputDetail(item);
    }
  }

  openInputHistory(item?: CatalogInputItem | null): void {
    if (item) {
      this.selectedHistoryItem.set(item);
    }
  }

  closeModal(): void {
    this.selectedInputModal.set(null);
    this.selectedHistoryItem.set(null);
    this.selectedPestModal.set(null);
  }

  approveInput(item: CatalogInputItem): void {
    item.status = 'Approved';
    item.updatedDate = 'Just now';
    item.updatedBy = 'Super Admin';
    this.showToast(`Input "${item.name}" has been approved for the catalog.`);
    this.closeModal();
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  // Add Input Actions
  saveInputDraft(): void {
    if (!this.newInput.name) {
      alert('Please enter an Input Name to save draft.');
      return;
    }

    const newCode = `IN-00${this.catalogInputs.length + 1}`;
    const newItem: CatalogInputItem = {
      id: newCode,
      name: this.newInput.name,
      code: this.newInput.productId || newCode,
      type: this.newInput.category || 'Organic Input',
      category: this.newInput.category || 'General',
      manufacturer: this.newInput.manufacturer || 'Farmer-prepared',
      applicableCrops: this.newInput.applicableCrops || 'All crops',
      status: 'Pending',
      updatedDate: 'Just now',
      updatedBy: 'Super Admin',
      dosage: this.newInput.dosage,
      unit: this.newInput.unit,
      method: this.newInput.method,
      frequency: this.newInput.frequency,
      composition: this.newInput.composition,
      purpose: this.newInput.purpose,
      restrictions: this.newInput.restrictions,
      referredPest: this.newInput.referredPest,
    };

    this.catalogInputs.unshift(newItem);
    this.showToast(`Draft for "${newItem.name}" saved successfully.`);
    this.resetInputForm();
    this.navigateTo('catalog');
  }

  submitInputForApproval(): void {
    if (!this.newInput.name || !this.newInput.category) {
      alert('Please fill in required fields: Input Name and Category.');
      return;
    }

    const newCode = `IN-00${this.catalogInputs.length + 1}`;
    const newItem: CatalogInputItem = {
      id: newCode,
      name: this.newInput.name,
      code: this.newInput.productId || newCode,
      type: this.newInput.category,
      category: this.newInput.category,
      manufacturer: this.newInput.manufacturer || 'Certified Organic Partner',
      applicableCrops: this.newInput.applicableCrops || 'All crops',
      status: 'Pending',
      updatedDate: 'Today',
      updatedBy: 'Super Admin',
      dosage: this.newInput.dosage,
      unit: this.newInput.unit,
      method: this.newInput.method,
      frequency: this.newInput.frequency,
      composition: this.newInput.composition,
      purpose: this.newInput.purpose,
      restrictions: this.newInput.restrictions,
      referredPest: this.newInput.referredPest,
    };

    this.catalogInputs.unshift(newItem);
    this.showToast(`Input "${newItem.name}" submitted for Agronomy approval.`);
    this.resetInputForm();
    this.navigateTo('catalog');
  }

  resetInputForm(): void {
    this.newInput = {
      name: '',
      referredPest: '',
      category: '',
      manufacturer: '',
      productId: '',
      description: '',
      validityDate: '',
      composition: '',
      purpose: '',
      applicableCrops: '',
      dosage: '',
      unit: '',
      method: '',
      frequency: '',
      restrictions: '',
    };
  }

  editInput(item: CatalogInputItem): void {
    this.newInput = {
      name: item.name,
      referredPest: item.referredPest || '',
      category: item.category,
      manufacturer: item.manufacturer,
      productId: item.code,
      description: item.purpose || '',
      validityDate: '',
      composition: item.composition || '',
      purpose: item.purpose || '',
      applicableCrops: item.applicableCrops,
      dosage: item.dosage || '',
      unit: item.unit || '',
      method: item.method || '',
      frequency: item.frequency || '',
      restrictions: item.restrictions || '',
    };
    this.closeModal();
    this.navigateTo('add_input');
  }

  // Pest & Disease Actions
  openPestDetail(pest: PestRecordItem): void {
    this.selectedPestModal.set(pest);
  }

  savePest(): void {
    if (!this.newPest.commonName) {
      alert('Please enter a Common Name for the pest/disease.');
      return;
    }

    const newRecord: PestRecordItem = {
      id: `PEST-00${this.pestLibrary.length + 1}`,
      commonName: this.newPest.commonName,
      scientificName: this.newPest.scientificName || 'Unverified spp.',
      type: this.newPest.type,
      affectedCrops: this.newPest.applicableCrops || 'Vegetables',
      riskNotes: this.newPest.seasonalRiskPeriod || 'Risk during monsoon',
      status: 'Published',
      updatedDate: 'Just now',
      owner: 'Agronomy team',
      symptoms: this.newPest.visibleSymptoms,
      organicTreatments: this.newPest.linkedOrganicTreatment || 'Approved organic bio-fungicide',
      prevention: this.newPest.preventivePractices,
    };

    this.pestLibrary.unshift(newRecord);
    this.showToast(`Pest & Disease record "${newRecord.commonName}" saved successfully.`);
    this.resetPestForm();
    this.navigateTo('pest_library');
  }

  resetPestForm(): void {
    this.newPest = {
      commonName: '',
      scientificName: '',
      type: 'Disease',
      description: '',
      verificationSource: '',
      applicableCrops: '',
      affectedParts: '',
      visibleSymptoms: '',
      indicators: '',
      lookalikes: '',
      seasonalRiskPeriod: '',
      growingConditions: '',
      weatherRisk: '',
      severityGuidance: '',
      preventivePractices: '',
      linkedOrganicTreatment: '',
      relevantGuide: '',
      safetyPrecautions: '',
    };
  }

  // Guide Management Actions (Images 2, 3, 4)
  filteredTreatmentGuides(): TreatmentGuideItem[] {
    const q = this.guidesSearchQuery.trim().toLowerCase();
    return this.treatmentGuides.filter((g) => {
      return (
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.linkedInputPest.toLowerCase().includes(q) ||
        g.applicableCrops.toLowerCase().includes(q) ||
        g.guideType.toLowerCase().includes(q)
      );
    });
  }

  paginatedTreatmentGuides(): TreatmentGuideItem[] {
    const all = this.filteredTreatmentGuides();
    const page = this.guidePage();
    const start = (page - 1) * this.guidesPerPage;
    return all.slice(start, start + this.guidesPerPage);
  }

  totalGuidePages(): number {
    return Math.ceil(this.filteredTreatmentGuides().length / this.guidesPerPage) || 1;
  }

  setGuidePage(p: number): void {
    if (p >= 1 && p <= this.totalGuidePages()) {
      this.guidePage.set(p);
    }
  }

  saveGuide(): void {
    if (!this.newGuideForm.title) {
      alert('Please enter a Guide title.');
      return;
    }

    const newGuide: TreatmentGuideItem = {
      id: `GD-0${this.treatmentGuides.length + 1}`,
      title: this.newGuideForm.title,
      guideType: (this.newGuideForm.guideType as any) || 'Input Application',
      linkedInputPest: this.newGuideForm.linkedInput || this.newGuideForm.linkedPest || 'General Input',
      applicableCrops: this.newGuideForm.applicableCrops || 'All Crops',
      version: 'v1',
      status: 'Published',
      lastUpdated: 'Just now',
    };

    this.treatmentGuides.unshift(newGuide);
    this.showToast(`Guide "${newGuide.title}" created and published successfully.`);
    this.resetGuideForm();
    this.navigateTo('guides_library');
  }

  resetGuideForm(): void {
    this.newGuideForm = {
      title: '',
      guideType: '',
      linkedInput: '',
      linkedPest: '',
      applicableCrops: '',
      growingStage: '',
      precautions: '',
      restrictions: '',
      method: '',
      instructions: '',
      dosage: '',
      unit: '',
      timing: '',
      references: '',
      changeSummary: '',
    };
  }

  // Incidents Management Actions (Image 5)
  filteredPestIncidents(): PestIncidentItem[] {
    const q = this.incidentsSearchQuery.trim().toLowerCase();
    return this.pestIncidents.filter((inc) => {
      return (
        !q ||
        inc.incidentCode.toLowerCase().includes(q) ||
        inc.farmer.toLowerCase().includes(q) ||
        inc.cropLocation.toLowerCase().includes(q) ||
        inc.pestOrDisease.toLowerCase().includes(q) ||
        inc.status.toLowerCase().includes(q)
      );
    });
  }

  openIncidentDetail(inc: PestIncidentItem): void {
    this.activeIncident.update((curr) => ({
      ...curr,
      incidentCode: inc.incidentCode,
      reportedDate: inc.reportedDate ? `${inc.reportedDate}, 08:30` : '13 Oct 2026, 08:30',
      farmer: inc.farmer,
      crop: inc.cropLocation.split(' - ')[0] || 'Tomato',
      farmPlot: inc.cropLocation.split(' - ')[2] || 'PLT-00124-1',
      field: inc.cropLocation.split(' - ')[2] || 'Field 1',
      pestOrDisease: inc.pestOrDisease || 'Not linked',
      severity: inc.severity,
      status: inc.status,
    }));
    this.navigateTo('incident_detail', undefined, inc.incidentCode);
  }

  reviewIncidentTreatment(inc: PestIncidentItem): void {
    this.openIncidentDetail(inc);
  }

  openLinkPestModal(): void {
    this.selectedPestToLink =
      this.activeIncident().pestOrDisease === 'Not linked' ? '' : this.activeIncident().pestOrDisease;
    this.linkPestModalOpen.set(true);
  }

  confirmLinkPest(): void {
    if (!this.selectedPestToLink) {
      alert('Please select a pest or disease.');
      return;
    }
    const pest = this.selectedPestToLink;
    this.activeIncident.update((curr) => ({
      ...curr,
      pestOrDisease: pest,
      history: [
        ...curr.history,
        {
          date: '13 Oct 2026, 09:15',
          author: 'Super Admin',
          text: `Linked pest or disease: ${pest}`,
        },
      ],
    }));
    this.showToast(`Pest or disease linked: ${pest}`);
    this.linkPestModalOpen.set(false);
  }

  openLinkGuideModal(): void {
    this.linkGuideModalOpen.set(true);
  }

  confirmLinkGuide(): void {
    if (this.activeIncident().pestOrDisease === 'Not linked') {
      return;
    }
    const guideName = 'Neem Oil – Foliar Spray Guide';
    this.activeIncident.update((curr) => ({
      ...curr,
      linkedTreatmentGuide: guideName,
      history: [
        ...curr.history,
        {
          date: '13 Oct 2026, 09:30',
          author: 'Super Admin',
          text: `Linked treatment guide: ${guideName}`,
        },
      ],
    }));
    this.showToast(`Treatment guide "${guideName}" linked successfully.`);
    this.linkGuideModalOpen.set(false);
  }

  openRecordNoteModal(): void {
    this.reviewNoteText = '';
    this.recordNoteModalOpen.set(true);
  }

  confirmSaveReviewNote(): void {
    if (!this.reviewNoteText) {
      alert('Please enter a review note.');
      return;
    }
    const note = this.reviewNoteText;
    this.activeIncident.update((curr) => ({
      ...curr,
      resolutionNotes: note,
      history: [
        ...curr.history,
        {
          date: '13 Oct 2026, 10:00',
          author: 'Super Admin',
          text: `Review note recorded: ${note}`,
        },
      ],
    }));
    this.showToast('Admin review note recorded successfully.');
    this.recordNoteModalOpen.set(false);
  }

  openReportIncident(): void {
    this.navigateTo('report_incident');
  }

  submitNewIncident(): void {
    if (!this.newIncident.farmer || !this.newIncident.pestOrDisease) {
      alert('Please fill in the required fields.');
      return;
    }
    const code = `PI-0${122 + this.pestIncidents.length}`;
    const item: PestIncidentItem = {
      id: code,
      incidentCode: code,
      farmer: this.newIncident.farmer,
      cropLocation: `${this.newIncident.crop} - ${this.newIncident.farmPlot}`,
      pestOrDisease: this.newIncident.pestOrDisease,
      severity: this.newIncident.severity,
      reportedDate: 'Today',
      status: 'Ongoing',
    };
    this.pestIncidents.unshift(item);
    this.showToast(`Incident ${code} reported successfully.`);
    this.navigateTo('pest_incidents');
  }

  openIncidentHistory(inc: PestIncidentItem): void {
    this.historyModalIncident.set(inc);
  }

  // Filtered lists
  filteredCatalogInputs(): CatalogInputItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    const type = this.typeFilter;
    const status = this.statusFilter;

    return this.catalogInputs.filter((item) => {
      const matchType = type === 'All Types' || item.type.toLowerCase() === type.toLowerCase();
      const matchStatus = status === 'All Statuses' || item.status === status;
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q) ||
        item.applicableCrops.toLowerCase().includes(q);

      return matchType && matchStatus && matchQuery;
    });
  }

  filteredPestLibrary(): PestRecordItem[] {
    const q = this.pestSearchQuery.trim().toLowerCase();

    return this.pestLibrary.filter((item) => {
      return (
        !q ||
        item.commonName.toLowerCase().includes(q) ||
        item.scientificName.toLowerCase().includes(q) ||
        item.affectedCrops.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    });
  }

  // Metrics getters
  totalInputsCount(): number {
    return this.catalogInputs.length;
  }

  approvedInputsCount(): number {
    return this.catalogInputs.filter((i) => i.status === 'Approved').length;
  }

  pendingInputsCount(): number {
    return this.catalogInputs.filter((i) => i.status === 'Pending').length;
  }

  inactiveInputsCount(): number {
    return this.catalogInputs.filter((i) => i.status === 'Inactive').length;
  }
}
