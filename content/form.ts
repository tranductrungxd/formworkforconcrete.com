// Text of the contact form (new on this site, see section 7 of the rebuild plan). The select options must match
// PROJECT_TYPES in services/contact/src/validate.ts.
export const form = {
  name: "Name",
  company: "Company",
  email: "Email",
  country: "Country",
  projectType: "Project type",
  projectTypes: [
    { value: "foundations", label: "Foundations" },
    { value: "walls", label: "Walls & stair cores" },
    { value: "slabs", label: "Slabs" },
    { value: "beams-columns", label: "Beams, girders & columns" },
    { value: "elevator-cores", label: "Elevator cores" },
    { value: "scaffolding", label: "Scaffolding & shoring" },
    { value: "other", label: "Other" },
  ],
  message: "Message",
  files: "Send your drawings",
  filesHint: "pdf, dwg, dxf, ifc, rvt, zip, jpg or png, up to 50 MB in total. Larger files: tell us in the message and we will send you a download link.",
  submit: "Send",
  sending: "Sending…",
  success: "Thank you. We have received your message and will reply by email.",
  errorRequired: "Please fill in your name, a valid email address and a message.",
  errorFiles: "The files could not be sent. Please use pdf, dwg, dxf, ifc, rvt, zip, jpg or png, up to 6 files and 50 MB in total.",
  errorVerification: "The security check did not pass. Please try again.",
  errorGeneric: "The message could not be sent. Please try again, or write to us at contact@formworkforconcrete.com.",
  unavailable: "The contact form is not available right now. Please write to us at",
} as const;
