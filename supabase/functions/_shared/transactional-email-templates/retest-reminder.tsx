import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Cuidar+'
const APP_URL = 'https://cuidarmaisbrasil.life'

interface RetestReminderProps {
  severity?: string
}

const RetestReminderEmail = ({ severity }: RetestReminderProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Já se passaram 15 dias — que tal refazer sua avaliação?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Como você está se sentindo agora?</Heading>
        <Text style={text}>
          Olá! Há cerca de 15 dias você fez uma autoavaliação no {SITE_NAME}
          {severity ? ` com resultado classificado como "${severity}"` : ''}.
        </Text>
        <Text style={text}>
          Acompanhar a evolução dos sintomas é uma parte importante do cuidado
          com a saúde mental. Que tal refazer o teste agora e comparar como
          você está se sentindo?
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={APP_URL} style={button}>
            Refazer minha avaliação
          </Button>
        </Section>
        <Text style={text}>
          Lembre-se: este teste não substitui um diagnóstico profissional.
          Se você ainda não buscou ajuda especializada, considere conversar
          com um psicólogo ou psiquiatra.
        </Text>
        <Text style={emergency}>
          <strong>Em emergência:</strong> ligue 188 (CVV) ou 192 (SAMU).
        </Text>
        <Text style={footer}>Com cuidado, equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RetestReminderEmail,
  subject: 'Lembrete: refaça sua avaliação no Cuidar+',
  displayName: 'Lembrete de retestagem (15 dias)',
  previewData: { severity: 'Moderada' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const button = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}
const emergency = {
  fontSize: '13px',
  color: '#b91c1c',
  backgroundColor: '#fef2f2',
  padding: '12px',
  borderRadius: '6px',
  margin: '24px 0 16px',
}
const footer = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '32px 0 0',
}
