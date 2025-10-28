// src/components/GameDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/GameDetails.css'; // Utwórz odpowiedni plik CSS
import LoadingSpinner from './ui/LoadingSpinner';

function GameDetails() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameRef = doc(db, 'games', id);
        const gameSnap = await getDoc(gameRef);
        if (gameSnap.exists()) {
          setGame({ id: gameSnap.id, ...gameSnap.data() });
        } else {
          console.log('No such game!');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!game) return <p>Game not found.</p>;

  return (
    <div className="game-details">
      <div className="hero-section">
        <img src={game.imageURL} alt={game.title} className="game-image" />
        <div className="game-cta">
          <h1>{game.title}</h1>
          <p>{game.description}</p>
          <button className="cta-button">Play Now</button>
        </div>
      </div>
      {/* Możesz dodać więcej sekcji dotyczących gry tutaj */}
    </div>
  );
}

export default GameDetails;
