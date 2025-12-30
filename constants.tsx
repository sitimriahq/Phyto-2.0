
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { DiseaseInfo, DiseaseStage } from './types';

export const DISEASE_DATABASE: Record<DiseaseStage, DiseaseInfo> = {
  H0: {
    name: "Healthy Plant",
    severity: 0,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    icon: CheckCircle,
    description: "Fully green leaf with no visible lesions or disease symptoms.",
    symptoms: [
      "Vibrant green leaves",
      "Stems firm and upright",
      "No spots, wilting or discoloration",
      "Uniform growth pattern",
      "Healthy leaf texture"
    ],
    biologicalInterpretation: "Strong physiological activity with optimal photosynthesis. Baseline class for comparison.",
    visualDescription: "Fully green leaf, no lesions",
    forAIUse: "Baseline class",
    treatment: {
      immediate: ["Continue current care practices", "Monitor regularly for any changes"],
      preventive: [
        "Maintain proper spacing (15-20cm) for good airflow",
        "Water at the base to keep leaves dry",
        "Remove any plant debris daily",
        "Practice crop rotation (avoid same location for 3 months)"
      ],
      cultural: ["Ensure adequate sunlight (6-8 hours)", "Maintain consistent watering schedule", "Use well-draining soil"]
    }
  },
  E1: {
    name: "Early Infection (Cercospora Leaf Spot)",
    severity: 1,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    icon: AlertCircle,
    description: "Initial fungal penetration with 1-3mm purple/brown dots and yellow halos.",
    symptoms: [
      "Small purple/brown dots (1-3mm diameter)",
      "Yellow halo around each lesion",
      "Light green patches on leaves",
      "Leaf edges may curl slightly",
      "Tips slightly pale",
      "Growth slower than usual",
      "Slightly leaf dropping in hot periods"
    ],
    biologicalInterpretation: "Initial fungal penetration through leaf stomata. Fungal spores germinating on moist leaf surfaces.",
    visualDescription: "1-3mm purple/brown dots with yellow halo",
    forAIUse: "Important for early detection model",
    lesionSizeRange: "1-3mm",
    treatment: {
      immediate: [
        "Remove affected leaves immediately (cut at stem)",
        "Isolate plant if in group setting (2m distance)",
        "Reduce overhead watering completely",
        "Improve air circulation around plants"
      ],
      chemical: [
        "Apply Chlorothalonil fungicide (500ppm solution)",
        "Alternative: Copper-based fungicide (1% solution)",
        "Spray in early morning (6-8am) or evening (5-7pm)",
        "Repeat application every 7-10 days",
        "Ensure thorough coverage of leaf surfaces"
      ],
      cultural: [
        "Water only at base of plant (avoid leaf wetting)",
        "Increase spacing between plants to 20-25cm",
        "Remove lower leaves touching soil",
        "Avoid working with plants when wet",
        "Ensure proper drainage"
      ],
      preventive: [
        "Apply preventive fungicide spray weekly",
        "Improve drainage around plants",
        "Ensure 6+ hours of direct sunlight"
      ]
    },
    prognosis: "Excellent recovery rate (>90%) if treated within 3-5 days. Plant can return to full health."
  },
  E2: {
    name: "Mid Infection (Cercospora Leaf Spot)",
    severity: 2,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    icon: AlertCircle,
    description: "Sporulation phase with expanding lesions (5-12mm), turning brown-grey.",
    symptoms: [
      "Lesions expand to 5-12mm diameter",
      "Color changes from purple to brown-grey",
      "Yellowing on older leaves (chlorosis)",
      "Turgor loss on leaves",
      "Wilting that doesn't recover after watering",
      "Edges turn brown and brittle",
      "Stems become thin or weak",
      "Stunted growth (50% slower)",
      "Multiple lesions per leaf (3-8)"
    ],
    biologicalInterpretation: "Sporulation begins. Fungus spreading through leaf tissue, disrupting chlorophyll production and water transport.",
    visualDescription: "Lesions expand (5-12mm), turn brown-grey",
    forAIUse: "Helps severity classifier",
    lesionSizeRange: "5-12mm",
    treatment: {
      immediate: [
        "Remove all infected leaves (up to 30% of plant)",
        "Dispose of removed leaves in sealed bag - do NOT compost",
        "Stop overhead watering completely",
        "Increase plant spacing to 25-30cm if possible"
      ],
      chemical: [
        "Apply systemic fungicide (Mancozeb 80% WP at 2g/L or Propiconazole 25% EC at 1ml/L)",
        "Alternate between two different fungicide classes to prevent resistance",
        "Spray every 5-7 days for 3 weeks minimum",
        "Ensure complete coverage including leaf undersides",
        "Use spreader-sticker for better adhesion"
      ],
      cultural: [
        "Water only in morning (6-9am) at soil level",
        "Remove all plant debris around base daily",
        "Improve soil drainage with sand/organic matter",
        "Add 5cm organic mulch to prevent splash-back",
        "Prune for better air circulation (remove dense foliage)"
      ],
      nutritional: [
        "Apply balanced fertilizer (NPK 15-15-15) to boost immunity",
        "Avoid high nitrogen fertilizers (>20% N)",
        "Consider potassium supplement (K2O) for disease resistance",
        "Foliar spray with calcium chloride (0.5%)"
      ]
    },
    prognosis: "Good recovery possible (60-70%) with aggressive treatment. Yield may be reduced by 15-30%. Treatment must be consistent."
  },
  E3: {
    name: "Late/Severe Infection (Cercospora Leaf Spot)",
    severity: 3,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    icon: XCircle,
    description: "Tissue death with large necrotic patches (>12mm), leaf yellowing, and defoliation.",
    symptoms: [
      "Large necrotic patches (>12mm, up to 30mm)",
      "Severe leaf yellowing throughout plant",
      "Significant defoliation (>40% leaf loss)",
      "Crispy brown edges, leaf curling",
      "Stems collapse or severe yellowing",
      "Multiple coalescing lesions per leaf (8+)",
      "Plant height stunted (<50% normal)",
      "Root may rot if overwatered",
      "Severe wilting even after watering",
      "Plant may not recover"
    ],
    biologicalInterpretation: "Tissue death & chlorophyll collapse. Extensive fungal colonization has severely damaged vascular system. Photosynthesis critically impaired.",
    visualDescription: "Large necrotic patches (>12mm), leaf yellowing, defoliation",
    forAIUse: "Highest severity level",
    lesionSizeRange: ">12mm",
    treatment: {
      immediate: [
        "Assess plant viability (if >70% affected, consider removal)",
        "Remove ALL diseased foliage (may be 50-80% of plant)",
        "If roots healthy and firm, cut back to healthy green tissue",
        "Isolate from other plants immediately (5m minimum)",
        "Disinfect all tools with 10% bleach solution after use"
      ],
      chemical: [
        "Apply high-strength systemic fungicide (Propiconazole 25% EC at 2ml/L)",
        "Soil drench with fungicide to treat root zone (100ml per plant)",
        "Spray every 5 days for immediate control (minimum 4 applications)",
        "May need 4-6 weekly applications for any recovery",
        "Consider tank-mixing compatible fungicides"
      ],
      cultural: [
        "Remove plant from growing area if recovery unlikely",
        "Do NOT compost diseased material - burn or dispose in sealed bag",
        "Sterilize all tools with 70% alcohol or 10% bleach",
        "Treat soil with fungicide or solarize before replanting",
        "Let area rest for 3-4 weeks before new planting",
        "Remove all fallen leaves and debris from surrounding area"
      ],
      recovery: [
        "If attempting recovery: provide optimal conditions (25-30°C, high light)",
        "Reduce watering to minimum (check soil moisture first)",
        "Support weak stems with bamboo stakes",
        "Monitor daily for improvement or further decline",
        "Apply foliar nutrients (liquid fertilizer at half strength)",
        "Expect 4-6 weeks for any visible improvement"
      ]
    },
    prognosis: "Poor. Recovery rate is low (20-30%). Yield loss typically 60-100%. Priority is preventing spread to healthy plants. Consider replanting."
  },
  N0: {
    name: "Non-Disease / Image Quality Issue",
    severity: 0,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
    icon: Info,
    description: "Image contains shadows, dirt, water droplets, or quality issues affecting accurate analysis.",
    symptoms: [
      "Heavy shadows obscuring leaf details",
      "Unclear or blurry plant features",
      "Dirt, mud, or debris on leaf surface",
      "Water droplets causing reflections",
      "Insufficient or uneven lighting",
      "Leaf out of focus",
      "Too far from subject",
      "Motion blur present"
    ],
    biologicalInterpretation: "Used for images that don't show clear disease symptoms or have quality issues. Helps AI model distinguish between actual disease and imaging artifacts.",
    visualDescription: "Shadows, dirt, or poor image quality",
    forAIUse: "Noise (non-disease) class for model training",
    treatment: {
      immediate: [
        "Gently clean leaves with soft, dry cloth",
        "Remove water droplets before photographing",
        "Wait for direct sunlight or use diffused flash",
        "Position leaf against neutral background if possible"
      ],
      photographyTips: [
        "Take photos in natural daylight (10am-3pm for best results)",
        "Hold camera steady or use tripod to avoid blur",
        "Focus directly on symptomatic areas or entire leaf",
        "Include entire lesion plus 2cm surrounding healthy tissue",
        "Keep camera 10-20cm from leaf for detail",
        "Avoid backlighting - position sun behind you",
        "Use macro mode if available on phone camera",
        "Take multiple photos from different angles"
      ],
      tips: [
        "Clean leaf surface gently before imaging",
        "Ensure no shadows fall on the leaf",
        "Use even, bright natural light",
        "Hold leaf flat if possible (support with paper)"
      ]
    }
  }
};
