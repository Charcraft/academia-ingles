import Link from "next/link";
import { Shield, Lock, Mail, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-charcoal-900 text-slate-300">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-12 border-b border-slate-800 pb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Aviso de Privacidad / Privacy Policy
          </h1>
          <p className="text-sm text-slate-500">Last updated: July 21, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none space-y-10">
          {/* 1. Identidad del Responsable */}
          <Section
            id="identity"
            icon={<Shield className="h-5 w-5 text-teal-400" />}
            title="1. Identidad del Responsable / Data Controller"
          >
            <p>
              <strong className="text-white">English for Healthcare Professionals</strong>{" "}
              (en adelante, &ldquo;EFHP&rdquo;), con domicilio en Monterrey,
              Nuevo Le&oacute;n, M&eacute;xico, es el responsable del tratamiento de
              los datos personales que usted proporcione a trav&eacute;s de
              nuestra plataforma.
            </p>
            <p>
              Correo electr&oacute;nico de contacto:{" "}
              <a
                href="mailto:contacto@englishforhealthcare.com"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                contacto@englishforhealthcare.com
              </a>
            </p>
          </Section>

          {/* 2. Datos Personales Recopilados */}
          <Section
            id="data-collected"
            icon={<FileText className="h-5 w-5 text-teal-400" />}
            title="2. Datos Personales Recopilados / Personal Data Collected"
          >
            <p>Recopilamos las siguientes categor&iacute;as de datos personales:</p>
            <ul>
              <li>Nombre completo</li>
              <li>Direcci&oacute;n de correo electr&oacute;nico</li>
              <li>Pa&iacute;s de residencia</li>
              <li>N&uacute;mero de tel&eacute;fono</li>
              <li>Profesi&oacute;n</li>
              <li>N&uacute;mero de licencia profesional</li>
              <li>A&ntilde;os de experiencia profesional</li>
              <li>
                Fotograf&iacute;a de credencial y/o t&iacute;tulo profesional
              </li>
              <li>
                Progreso acad&eacute;mico (resultados de lecciones, nivel CEFR,
                puntajes de ex&aacute;menes de pr&aacute;ctica)
              </li>
              <li>
                Grabaciones de voz para la pr&aacute;ctica de speaking
              </li>
            </ul>
          </Section>

          {/* 3. Finalidad del Tratamiento */}
          <Section
            id="purpose"
            icon={<FileText className="h-5 w-5 text-teal-400" />}
            title="3. Finalidad del Tratamiento / Purpose of Processing"
          >
            <h3 className="text-base font-semibold text-slate-200">
              Finalidades primarias (necesarias para el servicio):
            </h3>
            <ul>
              <li>Proveer el servicio educativo de ingl&eacute;s para profesionales de la salud</li>
              <li>Posicionamiento en el Marco Com&uacute;n Europeo de Referencia (CEFR)</li>
              <li>Seguimiento del progreso acad&eacute;mico</li>
              <li>Preparaci&oacute;n para ex&aacute;menes internacionales (IELTS, TOEFL, PTE)</li>
            </ul>

            <h3 className="mt-6 text-base font-semibold text-slate-200">
              Finalidades secundarias:
            </h3>
            <ul>
              <li>
                Contacto laboral futuro &mdash; &uacute;nicamente con su{" "}
                <strong className="text-white">consentimiento expl&iacute;cito</strong>{" "}
                otorgado mediante checkbox en el registro
              </li>
              <li>Mejora continua del servicio educativo</li>
              <li>
                Generaci&oacute;n de estad&iacute;sticas an&oacute;nimas y
                agregadas
              </li>
            </ul>
          </Section>

          {/* 4. Consentimiento */}
          <Section
            id="consent"
            icon={<Shield className="h-5 w-5 text-teal-400" />}
            title="4. Consentimiento / Consent"
          >
            <p>
              Al registrarse en EFHP, usted debe marcar un{" "}
              <strong className="text-white">checkbox obligatorio</strong>{" "}
              manifestando su consentimiento para el tratamiento de sus datos
              personales conforme al presente Aviso de Privacidad. Sin este
              consentimiento, no podremos proporcionarle nuestros servicios.
            </p>
            <p>
              Puede retirar su consentimiento en cualquier momento
              escribiendo a{" "}
              <a
                href="mailto:privacy@englishforhealthcare.com"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                privacy@englishforhealthcare.com
              </a>
              . La retirada del consentimiento no afectar&aacute; la licitud del
              tratamiento basado en el consentimiento previo a su retirada.
            </p>
            <div className="mt-4 rounded-lg border border-slate-800 bg-charcoal-950 p-4">
              <p className="text-xs text-slate-500">
                <strong className="text-slate-400">Base legal GDPR:</strong>{" "}
                El tratamiento de datos personales se realiza sobre las
                siguientes bases jur&iacute;dicas del Reglamento General de
                Protecci&oacute;n de Datos (GDPR): (a) consentimiento del
                interesado (Art. 6.1.a); (b) ejecuci&oacute;n de un contrato
                (Art. 6.1.b); y (c) inter&eacute;s leg&iacute;timo del
                responsable para la mejora del servicio (Art. 6.1.f).
              </p>
            </div>
          </Section>

          {/* 5. Transferencia de Datos */}
          <Section
            id="transfers"
            icon={<Lock className="h-5 w-5 text-teal-400" />}
            title="5. Transferencia de Datos / Data Transfers"
          >
            <p>
              <strong className="text-white">
                No compartimos, vendemos ni alquilamos sus datos personales a
                terceros
              </strong>{" "}
              para fines comerciales.
            </p>
            <p>
              Sus datos se almacenan en los siguientes proveedores de
              infraestructura:
            </p>
            <ul>
              <li>
                <strong className="text-white">Supabase</strong> &mdash;
                Plataforma de base de datos y autenticaci&oacute;n. Servidores
                ubicados en Estados Unidos y la Uni&oacute;n Europea. Cuenta con
                certificaci&oacute;n{" "}
                <strong className="text-white">SOC 2</strong> y cumple con el
                GDPR.
              </li>
              <li>
                <strong className="text-white">Stripe</strong> &mdash; Procesador
                de pagos (cuando se active el plan Premium). Stripe cumple con
                PCI DSS Nivel 1 y GDPR.
              </li>
            </ul>
            <p>
              Sus datos pueden ser transferidos internacionalmente a servidores
              en Estados Unidos. Dichas transferencias se realizan bajo las
              garant&iacute;as adecuadas exigidas por la legislaci&oacute;n
              aplicable, incluyendo Cl&aacute;usulas Contractuales Tipo (SCC)
              aprobadas por la Comisi&oacute;n Europea cuando sea requerido.
            </p>
          </Section>

          {/* 6. Derechos ARCO */}
          <Section
            id="arco"
            icon={<Shield className="h-5 w-5 text-teal-400" />}
            title="6. Derechos ARCO / ARCO Rights (Mexico)"
          >
            <p>
              Usted tiene derecho a ejercer sus derechos de{" "}
              <strong className="text-white">Acceso, Rectificaci&oacute;n,
              Cancelaci&oacute;n y Oposici&oacute;n</strong> (ARCO) respecto a
              sus datos personales. Para ejercer estos derechos, env&iacute;e una
              solicitud a{" "}
              <a
                href="mailto:privacy@englishforhealthcare.com"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                privacy@englishforhealthcare.com
              </a>{" "}
              con la siguiente informaci&oacute;n:
            </p>
            <ul>
              <li>Nombre completo del titular</li>
              <li>Correo electr&oacute;nico asociado a la cuenta</li>
              <li>Derecho que desea ejercer</li>
              <li>Descripci&oacute;n clara de su solicitud</li>
            </ul>
            <p>
              Nos comprometemos a responder su solicitud en un plazo m&aacute;ximo
              de <strong className="text-white">30 d&iacute;as h&aacute;biles</strong>.
            </p>
          </Section>

          {/* 7. Derechos GDPR adicionales */}
          <Section
            id="gdpr"
            icon={<Shield className="h-5 w-5 text-teal-400" />}
            title="7. Derechos GDPR Adicionales / Additional GDPR Rights"
          >
            <p>
              Si usted se encuentra en el Espacio Econ&oacute;mico Europeo (EEE)
              o el Reino Unido, adicionalmente tiene derecho a:
            </p>
            <ul>
              <li>
                <strong className="text-white">Portabilidad de datos</strong>{" "}
                &mdash; Recibir sus datos en un formato estructurado y de uso
                com&uacute;n
              </li>
              <li>
                <strong className="text-white">
                  Limitaci&oacute;n del tratamiento
                </strong>{" "}
                &mdash; Solicitar que restrinjamos el tratamiento de sus datos en determinadas circunstancias
              </li>
              <li>
                <strong className="text-white">
                  Presentar una queja
                </strong>{" "}
                ante una autoridad de control de protecci&oacute;n de datos en
                su pa&iacute;s de residencia
              </li>
            </ul>
          </Section>

          {/* 8. Conservación de Datos */}
          <Section
            id="retention"
            icon={<Lock className="h-5 w-5 text-teal-400" />}
            title="8. Conservaci&oacute;n de Datos / Data Retention"
          >
            <ul>
              <li>
                <strong className="text-white">
                  Fotograf&iacute;as de validaci&oacute;n
                </strong>{" "}
                (credencial/t&iacute;tulo): Se eliminan autom&aacute;ticamente{" "}
                <strong className="text-white">30 d&iacute;as</strong> despu&eacute;s de
                la aprobaci&oacute;n.
              </li>
              <li>
                <strong className="text-white">Datos de cuenta</strong>: Se
                conservan mientras la cuenta permanezca activa y durante{" "}
                <strong className="text-white">2 a&ntilde;os adicionales</strong>{" "}
                despu&eacute;s de la baja, con fines de cumplimiento legal y
                resoluci&oacute;n de disputas.
              </li>
              <li>
                <strong className="text-white">Grabaciones de speaking</strong>:
                Se conservan por un m&aacute;ximo de{" "}
                <strong className="text-white">12 meses</strong> desde su
                captura, tras lo cual se eliminan de forma permanente.
              </li>
            </ul>
          </Section>

          {/* 9. Medidas de Seguridad */}
          <Section
            id="security"
            icon={<Lock className="h-5 w-5 text-teal-400" />}
            title="9. Medidas de Seguridad / Security Measures"
          >
            <p>
              Implementamos medidas de seguridad t&eacute;cnicas, administrativas
              y f&iacute;sicas para proteger sus datos personales:
            </p>
            <ul>
              <li>
                <strong className="text-white">
                  Encriptaci&oacute;n en tr&aacute;nsito
                </strong>{" "}
                (TLS 1.3) y en reposo (AES-256)
              </li>
              <li>
                <strong className="text-white">
                  Acceso restringido por rol
                </strong>{" "}
                &mdash; Solo personal autorizado accede a datos personales seg&uacute;n
                su funci&oacute;n
              </li>
              <li>
                <strong className="text-white">
                  Autenticaci&oacute;n de dos factores (2FA)
                </strong>{" "}
                obligatoria para todas las cuentas de administrador
              </li>
              <li>
                <strong className="text-white">Auditor&iacute;a de accesos</strong>{" "}
                &mdash; Registro y monitoreo de todos los accesos a datos
                personales
              </li>
            </ul>
          </Section>

          {/* 10. Cookies */}
          <Section
            id="cookies"
            icon={<FileText className="h-5 w-5 text-teal-400" />}
            title="10. Cookies"
          >
            <p>
              Nuestra plataforma utiliza{" "}
              <strong className="text-white">
                exclusivamente cookies t&eacute;cnicas necesarias
              </strong>{" "}
              para el funcionamiento de la autenticaci&oacute;n de usuarios
              (gestionadas por Supabase Auth). Estas cookies son esenciales
              para mantener su sesi&oacute;n activa y no pueden ser deshabilitadas.
            </p>
            <p>
              <strong className="text-white">
                No utilizamos cookies de tracking, publicidad ni an&aacute;lisis
                de terceros.
              </strong>{" "}
              No se instalan cookies de marketing, remarketing o redes sociales
              en su navegador.
            </p>
          </Section>

          {/* 11. Modificaciones */}
          <Section
            id="modifications"
            icon={<FileText className="h-5 w-5 text-teal-400" />}
            title="11. Modificaciones al Aviso / Policy Updates"
          >
            <p>
              EFHP se reserva el derecho de modificar el presente Aviso de
              Privacidad en cualquier momento. En caso de cambios
              sustanciales, se lo notificaremos por correo electr&oacute;nico
              con al menos{" "}
              <strong className="text-white">30 d&iacute;as de anticipaci&oacute;n</strong>{" "}
              a la entrada en vigor de las modificaciones. Le recomendamos
              revisar peri&oacute;dicamente este aviso.
            </p>
          </Section>

          {/* 12. Contacto */}
          <Section
            id="contact"
            icon={<Mail className="h-5 w-5 text-teal-400" />}
            title="12. Contacto / Contact"
          >
            <p>
              Para cualquier duda, queja o solicitud relacionada con este Aviso
              de Privacidad o el tratamiento de sus datos personales,
              cont&aacute;ctenos a trav&eacute;s de:
            </p>
            <ul>
              <li>
                Correo electr&oacute;nico:{" "}
                <a
                  href="mailto:privacy@englishforhealthcare.com"
                  className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
                >
                  privacy@englishforhealthcare.com
                </a>
              </li>
              <li>
                Correo general:{" "}
                <a
                  href="mailto:contacto@englishforhealthcare.com"
                  className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
                >
                  contacto@englishforhealthcare.com
                </a>
              </li>
            </ul>
          </Section>
        </div>

        {/* Back link */}
        <div className="mt-16 border-t border-slate-800 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-teal-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al inicio / Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ==================== Section sub-component ==================== */

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-slate-800/50 bg-charcoal-950/80 p-6 sm:p-8",
        "transition-colors hover:border-slate-800"
      )}
    >
      <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold text-white">
        <span className="flex-shrink-0 rounded-lg bg-teal-500/10 p-2">
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-400 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_p]:text-slate-400">
        {children}
      </div>
    </section>
  );
}
