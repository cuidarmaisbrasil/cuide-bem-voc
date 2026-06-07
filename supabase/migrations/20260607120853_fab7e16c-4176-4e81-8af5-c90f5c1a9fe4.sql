-- Update ECIG items to Silva & Puente-Palacios (2010) original Brazilian Portuguese wording
UPDATE public.instrument_questions SET text = 'Quanto desacordo sobre as decisões de trabalho o grupo tem que enfrentar?'                                  WHERE instrument='ecig' AND n=1;
UPDATE public.instrument_questions SET text = 'Quanto atrito pessoal existe entre os membros da equipe?'                                              WHERE instrument='ecig' AND n=2;
UPDATE public.instrument_questions SET text = 'Quanta diferença de opinião sobre a planificação das tarefas existe entre a equipe?'                  WHERE instrument='ecig' AND n=3;
UPDATE public.instrument_questions SET text = 'Quanta tensão emocional há no relacionamento interpessoal entre os membros?'                           WHERE instrument='ecig' AND n=4;
UPDATE public.instrument_questions SET text = 'Quanto desacordo pessoal é evidente entre os membros da equipe?'                                       WHERE instrument='ecig' AND n=5;
UPDATE public.instrument_questions SET text = 'Quanta raiva existe entre os membros do grupo?'                                                         WHERE instrument='ecig' AND n=6;
UPDATE public.instrument_questions SET text = 'Quanta diferença de opinião sobre a realização das tarefas existe na sua equipe?'                      WHERE instrument='ecig' AND n=7;
UPDATE public.instrument_questions SET text = 'Quanto conflito ocorre entre os membros durante a delegação das tarefas?'                              WHERE instrument='ecig' AND n=8;
UPDATE public.instrument_questions SET text = 'Quanto tempo o grupo gasta resolvendo conflitos interpessoais entre os membros?'                       WHERE instrument='ecig' AND n=9;
UPDATE public.instrument_questions SET text = 'Quanta discordância sobre a maneira de executar as tarefas existe na equipe?'                          WHERE instrument='ecig' AND n=10;
UPDATE public.instrument_questions SET text = 'Quanto desafeto há entre os membros da equipe de trabalho?'                                            WHERE instrument='ecig' AND n=11;

-- Ensure all 11 are active and scales correct per Silva & Puente-Palacios (2010)
UPDATE public.instrument_questions SET active=true, response_set='ecig_5' WHERE instrument='ecig';
UPDATE public.instrument_questions SET scale='tarefa'         WHERE instrument='ecig' AND n IN (1,3,7,8,10);
UPDATE public.instrument_questions SET scale='relacionamento' WHERE instrument='ecig' AND n IN (2,4,5,6,9,11);
