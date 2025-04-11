import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useToast } from "./hooks/use-toast";

export function GameLobby() {
  const [view, setView] = useState<"menu" | "create" | "join" | "game">("menu");
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const { toast } = useToast();

  if (roomId) {
    return <GameRoom roomId={roomId} onExit={() => setRoomId(null)} />;
  }

  return (
    <div className="space-y-6 text-right">
      {view === "menu" && (
        <div className="space-y-4">
          <button
            onClick={() => setView("create")}
            className="w-full bg-blue-600 text-white p-4 rounded-lg text-xl hover:bg-blue-700"
          >
            إنشاء غرفة جديدة
          </button>
          <button
            onClick={() => setView("join")}
            className="w-full bg-green-600 text-white p-4 rounded-lg text-xl hover:bg-green-700"
          >
            الانضمام إلى غرفة
          </button>
        </div>
      )}

      {view === "create" && (
        <CreateRoom
          onBack={() => setView("menu")}
          onCreated={(id) => setRoomId(id)}
        />
      )}

      {view === "join" && (
        <JoinRoom
          onBack={() => setView("menu")}
          onJoined={(id) => setRoomId(id)}
        />
      )}
    </div>
  );
}

function CreateRoom({ onBack, onCreated }: { onBack: () => void; onCreated: (roomId: Id<"rooms">) => void }) {
  const createRoom = useMutation(api.rooms.createRoom);
  const [playerCount, setPlayerCount] = useState(4);
  const [spyCount, setSpyCount] = useState(1);
  const [timeLimit, setTimeLimit] = useState(5);

  const handleCreate = async () => {
    try {
      const { roomId } = await createRoom({ playerCount, spyCount, timeLimit });
      onCreated(roomId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">إنشاء غرفة جديدة</h2>
      
      <div className="space-y-2">
        <label className="block">عدد اللاعبين ({playerCount})</label>
        <input
          type="range"
          min="3"
          max="9"
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block">عدد الجواسيس ({spyCount})</label>
        <input
          type="range"
          min="1"
          max="3"
          value={spyCount}
          onChange={(e) => setSpyCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block">الوقت بالدقائق ({timeLimit})</label>
        <input
          type="range"
          min="1"
          max="10"
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
        >
          إنشاء
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}

function JoinRoom({ onBack, onJoined }: { onBack: () => void; onJoined: (roomId: Id<"rooms">) => void }) {
  const joinRoom = useMutation(api.rooms.joinRoom);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleJoin = async () => {
    try {
      const { roomId } = await joinRoom({ code, name });
      onJoined(roomId);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">الانضمام إلى غرفة</h2>
      
      <div className="space-y-2">
        <label className="block">اسمك</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="ادخل اسمك"
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <label className="block">رمز الغرفة</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full p-2 border rounded"
          placeholder="ادخل رمز الغرفة"
          maxLength={6}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleJoin}
          disabled={!code || !name}
          className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          انضمام
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}

function GameRoom({ roomId, onExit }: { roomId: Id<"rooms">; onExit: () => void }) {
  const gameState = useQuery(api.rooms.getRoomState, { roomId });
  const startGame = useMutation(api.rooms.startGame);

  if (!gameState) {
    return <div>جاري التحميل...</div>;
  }

  const { room, players, isSpy, word, timeLeft } = gameState;
  const currentPlayer = players.find(p => p.isSpy === isSpy);
  const isHost = currentPlayer && room.hostId === currentPlayer.userId;

  return (
    <div className="space-y-6 text-right">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">رمز الغرفة: {room.code}</h2>
        <p>اللاعبين: {players.length}/{room.playerCount}</p>
        {room.status === "playing" && (
          <p>الوقت المتبقي: {Math.ceil((timeLeft ?? 0) / 1000)} ثانية</p>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-2">اللاعبين:</h3>
        <ul className="space-y-2">
          {players.map((player) => (
            <li key={player._id} className="flex justify-between items-center">
              <span>{player.name}</span>
              {room.status === "playing" && player.isSpy && (
                <span className="text-red-600">(جاسوس)</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {room.status === "playing" && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-2">دورك:</h3>
          {isSpy ? (
            <p className="text-red-600 font-bold">أنت الجاسوس! حاول معرفة الكلمة</p>
          ) : (
            <p className="text-green-600 font-bold">الكلمة هي: {word}</p>
          )}
        </div>
      )}

      {room.status === "waiting" && isHost && (
        <button
          onClick={() => startGame({ roomId })}
          disabled={players.length < room.playerCount}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          بدء اللعبة
        </button>
      )}

      <button
        onClick={onExit}
        className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
      >
        خروج
      </button>
    </div>
  );
}
