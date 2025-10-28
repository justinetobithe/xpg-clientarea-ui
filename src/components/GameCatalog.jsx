// src/components/GameCatalog.js
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import './css/GameCatalog.css'; // Utwórz odpowiedni plik CSS

function GameCatalog() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, orderBy('createdAt', sortOrder));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGames(gamesData);
    });

    return () => unsubscribe();
  }, [sortOrder]);

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(filter.toLowerCase()) ||
    game.description.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <section className="game-catalog-section">
      <h2>Game Catalog</h2>
      <div className="catalog-controls">
        <input
          type="text"
          placeholder="Search games..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
      <div className="catalog-grid">
        {filteredGames.map(game => (
          <div key={game.id} className="catalog-tile">
            <img src={game.imageURL} alt={game.title} />
            <h3>{game.title}</h3>
            <p>{game.description.substring(0, 100)}...</p>
            <Link to={`/games/${game.id}`} className="details-button">View Details</Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default GameCatalog;
