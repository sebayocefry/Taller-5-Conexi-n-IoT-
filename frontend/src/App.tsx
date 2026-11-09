import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
type SensorCardProps ={
  titulo: string;
  valor: number;
  unidad: string;
};

function SensorCard({titulo,valor,unidad}: SensorCardProps){
  return(
    <article>
    <h2>{titulo}</h2>
    <p>{valor} {unidad}</p>
    </article>
  );
}
function App() {
  return(
    <main>
      <h1>Monitor IoT - Taller 5</h1>
      <SensorCard
        titulo = "temperatura"
        valor= {24.56}
        unidad = "C"
      />

      <SensorCard
        titulo = "humedad"
        valor = {65.32}
        unidad = "%"
      />

      <SensorCard
        titulo = "nivel del agua"
        valor = {3}
        unidad = "/4"
      />
      </main>
  );
}

export default App;
