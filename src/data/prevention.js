export const demoWeek = {
  percentages:[82,74,91], points:847,
  bars:[35,52,44,70,61,83,94], weekdays:['S','T','Q','Q','S','S','D'],
};

export function createPreventionMock(dates, goals) {
  const values = {
    sono:[7,8,8.5,6.5,8,8],
    alimentacao:[3,2,3,3,2,3],
    atividade:[30,45,0,30,20,40],
  };
  return {
    goals:{...goals},
    records:dates.slice(0,-1).map((date,i) => ({
      date, sono:values.sono[i], alimentacao:values.alimentacao[i],
      atividade:values.atividade[i], quality:'Boa', notes:'', targets:{...goals},
    })),
    sharing:{professional:'',sono:false,alimentacao:false,atividade:false,active:false},
  };
}
