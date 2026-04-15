# prompts de journaling — um por dia do ano, rotacionados pelo dia juliano
from datetime import date, datetime, timezone


PROMPTS_DIARIOS = [
    "Como você está se sentindo agora?",
    "O que te deixou grato hoje?",
    "Qual foi o momento mais difícil de hoje?",
    "O que você aprendeu hoje?",
    "Descreva um momento que te fez sorrir.",
    "O que você faria diferente hoje?",
    "Qual meta você quer focar amanhã?",
    "Como está sua energia neste momento?",
    "O que te preocupa agora? Escreva para liberar.",
    "Liste 3 coisas boas que aconteceram hoje.",
    "O que te motivou a levantar hoje?",
    "Qual hábito você mais quer manter?",
    "Quem te inspirou recentemente?",
    "O que você precisa deixar ir?",
    "Como você cuidou de si hoje?",
    "Descreva seu dia em uma palavra. Por quê?",
    "O que você quer que amanhã traga?",
    "Qual conquista pequena te orgulha hoje?",
    "Como você pode ser mais gentil consigo?",
    "O que te deu paz hoje?",
    "Se hoje fosse perfeito, como seria?",
    "O que te fez rir?",
    "Qual desafio te fortaleceu recentemente?",
    "O que você agradece no seu corpo?",
    "Qual conversa marcou seu dia?",
    "O que te deixou frustrado e como lidou?",
    "Se pudesse enviar uma mensagem para si do passado, o que diria?",
    "Qual é o seu maior sonho agora?",
    "Como foi sua qualidade de sono?",
    "O que te faz se sentir vivo?",
]


def prompt_do_dia () -> str:
    """retorna o prompt do dia usando o número do dia no ano como índice"""
    dia = datetime.now(timezone.utc).date().timetuple().tm_yday
    return PROMPTS_DIARIOS[dia % len(PROMPTS_DIARIOS)]
