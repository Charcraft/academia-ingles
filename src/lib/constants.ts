import type { Country } from "@/types";

export const countries: Country[] = [
  { name: "Mexico", code: "MX", flag: "🇲🇽", phoneCode: "+52" },
  { name: "Colombia", code: "CO", flag: "🇨🇴", phoneCode: "+57" },
  { name: "Peru", code: "PE", flag: "🇵🇪", phoneCode: "+51" },
  { name: "Argentina", code: "AR", flag: "🇦🇷", phoneCode: "+54" },
  { name: "Chile", code: "CL", flag: "🇨🇱", phoneCode: "+56" },
  { name: "Ecuador", code: "EC", flag: "🇪🇨", phoneCode: "+593" },
  { name: "Venezuela", code: "VE", flag: "🇻🇪", phoneCode: "+58" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", phoneCode: "+55" },
  { name: "Philippines", code: "PH", flag: "🇵🇭", phoneCode: "+63" },
  { name: "India", code: "IN", flag: "🇮🇳", phoneCode: "+91" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", phoneCode: "+234" },
  { name: "Spain", code: "ES", flag: "🇪🇸", phoneCode: "+34" },
  { name: "United States", code: "US", flag: "🇺🇸", phoneCode: "+1" },
  { name: "Canada", code: "CA", flag: "🇨🇦", phoneCode: "+1" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", phoneCode: "+44" },
  { name: "Australia", code: "AU", flag: "🇦🇺", phoneCode: "+61" },
  { name: "Other", code: "OT", flag: "🌍", phoneCode: "" },
];

export const professions = [
  "Enfermera",
  "Enfermero",
  "Doctor",
  "Doctora",
  "Fisioterapeuta",
  "Paramédico",
  "Odontólogo",
  "Odontóloga",
  "Psicólogo",
  "Psicóloga",
  "Nutriólogo",
  "Nutrióloga",
  "Técnico en enfermería",
  "Auxiliar de enfermería",
  "Other",
];

export const examOptions = [
  { value: "ielts_academic", label: "IELTS Academic" },
  { value: "toefl_ibt", label: "TOEFL iBT" },
  { value: "pte_academic", label: "PTE Academic" },
  { value: "undecided", label: "Aún no lo sé" },
];
