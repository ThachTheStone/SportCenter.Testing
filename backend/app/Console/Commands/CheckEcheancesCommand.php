<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Echeance;
use App\Models\AdminNotification;
use App\Models\ClientNotification;

class CheckEcheancesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-echeances';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check payment installments at D-5 and D+30, and generate alerts.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $todayPlus5 = now()->addDays(5)->toDateString();
        $todayMinus30 = now()->subDays(30)->toDateString();

        // 1. Alertes J-5
        $avant5Jours = Echeance::with(['cotisation.client'])
            ->where('statut', 'en_attente')
            ->whereDate('date_echeance', $todayPlus5)
            ->get();

        foreach ($avant5Jours as $echeance) {
            $client = $echeance->cotisation->client;
            if (!$client) continue;
            
            AdminNotification::create([
                'type' => 'warning',
                'titre' => 'Payment Reminder (D-5)',
                'message' => "The {$echeance->montant} MAD payment for {$client->prenom} {$client->nom} is due in 5 days.",
                'lien' => "/admin/paiements"
            ]);

            ClientNotification::create([
                'client_id' => $client->id,
                'type' => 'info',
                'titre' => 'Your payment is coming up',
                'message' => "Your {$echeance->montant} MAD installment is due in 5 days."
            ]);
        }

        $this->info("D-5 reminders sent: " . $avant5Jours->count());

        // 2. Alertes J+30 (Retard majeur)
        $retard30Jours = Echeance::with(['cotisation.client'])
            ->where('statut', 'en_attente')
            ->whereDate('date_echeance', $todayMinus30)
            ->get();

        foreach ($retard30Jours as $echeance) {
            $client = $echeance->cotisation->client;
            if (!$client) continue;

            AdminNotification::create([
                'type' => 'danger',
                'titre' => 'Major Delay (> 30 days)',
                'message' => "The {$echeance->montant} MAD payment for {$client->prenom} {$client->nom} is more than 30 days overdue.",
                'lien' => "/admin/paiements"
            ]);

            ClientNotification::create([
                'client_id' => $client->id,
                'type' => 'danger',
                'titre' => 'Critical payment delay',
                'message' => "Your {$echeance->montant} MAD installment is more than 30 days overdue. Please settle it as soon as possible."
            ]);
        }

        $this->info("D+30 overdue alerts sent: " . $retard30Jours->count());
    }
}
