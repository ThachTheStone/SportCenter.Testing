<?php

use App\Models\User;
use App\Models\Client;
use App\Models\Cotisation;
use App\Models\Paiement;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DEBUT DU TEST DE REGISTRATION ---\n";

$email = "test_pay_".time()."@example.com";
$data = [
    'name' => 'John Doe',
    'email' => $email,
    'password' => 'Password123!',
    'password_confirmation' => 'Password123!',
    'telephone' => '0612345678',
    'date_naissance' => '1990-01-01',
    'specialite' => 'musculation',
    'plan' => 'trimestriel',
    'payment_method' => 'card'
];

try {
    // On simule l'appel au controlleur
    $controller = new \App\Http\Controllers\Auth\AuthController();
    $request = \Illuminate\Http\Request::create('/api/register', 'POST', $data);
    
    $response = $controller->register($request);
    
    echo "Status code: " . $response->getStatusCode() . "\n";
    echo "Response: " . $response->getContent() . "\n";

    if ($response->getStatusCode() === 201) {
        $user = User::where('email', $email)->first();
        $client = Client::where('user_id', $user->id)->first();
        $cotisation = Cotisation::where('client_id', $client->id)->first();
        
        echo "User créé: ID " . $user->id . "\n";
        echo "Cotisation créée: ID " . $cotisation->id . ", Montant: " . $cotisation->montant_annuel . "\n";
        
        $echeances = $cotisation->echeances;
        echo "Nombre d'échéances générées: " . $echeances->count() . "\n";
        
        foreach ($echeances as $e) {
            echo " - Échéance #" . $e->numero . ": " . $e->montant . " MAD, Statut: " . $e->statut . "\n";
            $p = Paiement::where('echeance_id', $e->id)->first();
            if ($p) {
                echo "   -> PAIEMENT TROUVÉ: " . $p->montant . " MAD le " . $p->date_paiement . " via " . $p->methode . "\n";
            }
        }
        
        // Nettoyage (facultatif)
        // $user->delete();
    }

} catch (\Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

echo "--- FIN DU TEST ---\n";
