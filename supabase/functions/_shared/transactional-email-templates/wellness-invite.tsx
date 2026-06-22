import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Cuidar+'

interface Props {
  companyName?: string
  link?: string
  wave?: 'phq9' | 'ecig' | 'copsoq' | 'psicossocial' | 'assedio_sexual'
}

const WAVE_COPY: Record<string, { title: string; intro: string; minutes: string; subject: string }> = {
  phq9: {
    title: 'Etapa 1: como você tem se sentido?',
    intro: 'Esta primeira avaliação foca em sintomas de humor e bem-estar emocional. É anônima — sua empresa só verá resultados agregados.',
    minutes: '3 a 5 minutos',
    subject: 'Avaliação de bem-estar — etapa 1 (humor)',
  },
  ecig: {
    title: 'Etapa 2: como está o clima na sua equipe?',
    intro: 'Esta etapa avalia conflitos e tensões dentro do grupo de trabalho. É anônima e leva poucos minutos.',
    minutes: '3 a 4 minutos',
    subject: 'Avaliação de bem-estar — etapa 2 (clima da equipe)',
  },
  copsoq: {
    title: 'Etapa 3: como está o seu trabalho?',
    intro: 'Esta etapa avalia fatores psicossociais do seu trabalho (exigências, autonomia, apoio, reconhecimento). É anônima.',
    minutes: '8 a 15 minutos',
    subject: 'Avaliação de bem-estar — etapa 3 (trabalho)',
  },
  psicossocial: {
    title: 'Etapa 4: clima psicossocial e situações no trabalho',
    intro: 'Esta etapa avalia a frequência de situações de assédio moral, hostilidade e exclusão (Inventário de Leymann — LIPT-60). É anônima e estritamente confidencial.',
    minutes: '6 a 10 minutos',
    subject: 'Avaliação de bem-estar — etapa 4 (clima psicossocial)',
  },
  assedio_sexual: {
    title: 'Etapa 5: percepções sobre assédio sexual no trabalho',
    intro: 'Esta etapa avalia atitudes e percepções sobre assédio sexual e sobre o clima da empresa para denúncias (MDiSH + SHRAS). É anônima e estritamente confidencial.',
    minutes: '6 a 10 minutos',
    subject: 'Avaliação de bem-estar — etapa 5 (assédio sexual)',
  },
}

const Email = ({ companyName, link, wave = 'phq9' }: Props) => {
  const copy = WAVE_COPY[wave] ?? WAVE_COPY.phq9
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{copy.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{copy.title}</Heading>
          <Text style={text}>
            Você foi convidado(a){companyName ? ` pela ${companyName}` : ''} a participar de um programa de avaliação preventiva de bem-estar no trabalho.
          </Text>
          <Text style={text}>{copy.intro}</Text>
          <Text style={text}><strong>Tempo estimado:</strong> {copy.minutes}.</Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={link} style={button}>Responder agora</Button>
          </Section>
          <Text style={small}>
            Suas respostas são confidenciais. A empresa recebe apenas estatísticas agregadas, sem identificação individual.
          </Text>
          <Text style={emergency}>
            <strong>Em emergência:</strong> ligue 188 (CVV) ou 192 (SAMU).
          </Text>
          <Text style={footer}>Equipe {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => WAVE_COPY[d?.wave ?? 'phq9']?.subject ?? 'Avaliação de bem-estar',
  displayName: 'Convite — programa de bem-estar',
  previewData: { companyName: 'Sua empresa', link: 'https://cuidarmaisbrasil.life/w/exemplo/phq9', wave: 'phq9' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const small = { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }
const emergency = { fontSize: '13px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', margin: '24px 0 16px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0' }
