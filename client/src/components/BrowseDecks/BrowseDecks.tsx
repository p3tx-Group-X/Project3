import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBookOpen, FaPlus } from "react-icons/fa";
import { QUERY_MY_DECKS, QUERY_CARD_DECKS } from "../../utils/queries";
import { REMOVE_CARDDECK, UPDATE_CARDDECK } from "../../utils/mutations";
import { CardDeck } from "../../interfaces/CardDeck";
import IndividualDeck from "../IndividualDeck/IndividualDeck";
import "./BrowseDecks.css";

const BrowseDecks = () => {
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.user.value);
  const shouldRunpersonalDecksQuery = !!user;
  const [openModal, setOpenModal] = useState(false);
  const [deckIdToRemove, setDeckIdToRemove] = useState("");

  const { loading, data: personalDecks, refetch: refetchPersonalDecks } = useQuery(QUERY_MY_DECKS,
    {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      skip: !shouldRunpersonalDecksQuery
    }
  );

  const { data: publicDecks, refetch: refetchPublicDecks } = useQuery(QUERY_CARD_DECKS,
    {
      variables: { isPublic: true },
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    }
  );

  const personalDecksArr = personalDecks?.myCardDecks || [];
  const publicDecksArr = publicDecks?.cardDecks.filter((deck: CardDeck) => deck.user?._id !== user?._id) || [];

  const [removeCardDeckMutation] = useMutation(REMOVE_CARDDECK, {
    onCompleted: () => {
      refetchPersonalDecks();
      refetchPublicDecks();
    },
  });

  const removeDeck = async () => {
    try {
      await removeCardDeckMutation({
        variables: { deckId: deckIdToRemove },
      });
      setOpenModal(false);
    } catch (error: any) {
      setOpenModal(false);
      console.error(error.message);
      alert(error);
    }
  };

  const [updateCardDeckMutation] = useMutation(UPDATE_CARDDECK, {
    onCompleted: () => {
      refetchPersonalDecks();
      refetchPublicDecks();
    },
  });

  const handleVisibility = async (deckId: string, isPublic: boolean) => {
    try {
      const deck = personalDecksArr.find((deck: any) => deck._id === deckId);
      await updateCardDeckMutation({
        variables: {
          deckId: deckId,
          input: {
            name: deck.name,
            categoryName: deck.categoryName,
            userId: user._id,
            isPublic,
          }
        },
      });
    } catch (error: any) {
      console.error(error.message);
      alert(error);
    }
  };

  const cancelRemoveDeck = () => {
    setDeckIdToRemove("");
    setOpenModal(false);
  };

  const handleRemoveCardDeck = async (deckId: string) => {
    setDeckIdToRemove(deckId);
    setOpenModal(true);
  };

  const handleManageDeck = (deckId: string) => {
    navigate(`/browse-decks/${deckId}`);
  };

  const handleStudyDeck = (deckId: string) => {
    navigate(`/study-deck/${deckId}`);
  };

  const handleImportFlashcard = (deckId: string) => {
    navigate(`/deck/${deckId}/import`)
  };

  const getProficiencyClass = (proficiency: string | undefined) => {
    if (!proficiency || proficiency === "No Data") return "";
    return proficiency.toLowerCase();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading available decks...</div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      {openModal && (
        <div className="modal show">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <h3 style={{ marginBottom: "1rem" }}>Delete Deck?</h3>
                <p>
                  This will permanently delete this deck and all associated
                  flashcards. This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  onClick={cancelRemoveDeck}
                  type="button"
                  className="modal-btn btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={removeDeck}
                  type="button"
                  className="modal-btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {user ?
        <div className="personal-decks">
          <h2>My Decks</h2>
          <div className="decks-container">
            {!personalDecksArr.length ?
              <div className="browse-page">
                <div className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">
                      <FaBookOpen />
                    </div>
                    <h3>No Decks Available</h3>
                    <p>
                      {user ? (
                        <>
                          You haven't created any decks yet.
                          <br />
                          Start building your knowledge! 🌱
                        </>
                      ) : (
                        "Sign in to create your own decks or browse public decks."
                      )}
                    </p>
                    {user && (
                      <button
                        className="empty-state-btn"
                        onClick={() => navigate("/import")}
                      >
                        <FaPlus className="btn-icon" />
                        Create Your First Deck
                      </button>
                    )}
                  </div>
                </div>
              </div>
              : personalDecks.myCardDecks.map((deck: CardDeck) => (
                <IndividualDeck
                  key={deck._id}
                  deck={deck}
                  user={user}
                  handleRemoveCardDeck={handleRemoveCardDeck}
                  handleManageDeck={handleManageDeck}
                  handleStudyDeck={handleStudyDeck}
                  handleImportFlashcard={handleImportFlashcard}
                  getProficiencyClass={getProficiencyClass}
                  handleVisibility={handleVisibility}
                />
            ))}
          </div>
        </div> : null
      }
      <div className="public-decks">
        <h2>Public Decks</h2>
        <div className="decks-container">
          {publicDecksArr.map((deck: CardDeck) => (
            <IndividualDeck
              key={deck._id}
              deck={deck}
              user={user}
              handleRemoveCardDeck={handleRemoveCardDeck}
              handleManageDeck={handleManageDeck}
              handleStudyDeck={handleStudyDeck}
              handleImportFlashcard={handleImportFlashcard}
              getProficiencyClass={getProficiencyClass}
              handleVisibility={handleVisibility}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowseDecks;
