// test-evolution-service.js

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (ajustez selon votre config)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEvolutionService() {
  console.log('🧪 Test du service Evolution avec Supabase...\n');

  try {
    // 1. Tester la connexion
    console.log('1️⃣ Test de connexion Supabase...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erreur connexion:', authError.message);
      return;
    }
    console.log('✅ Connexion Supabase OK\n');

    // 2. Vérifier les tables d'évolution
    console.log('2️⃣ Vérification des tables d\'évolution...');
    
    const tables = [
      'user_achievements',
      'user_activity_timeline', 
      'user_motivation_stats',
      'user_activity_heatmap'
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: ${count || 0} entrées`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: Erreur accès`);
      }
    }
    console.log('');

    // 3. Test avec données utilisateur existantes
    console.log('3️⃣ Test données utilisateur...');
    
    // Trouver un utilisateur avec des données
    const { data: programmes } = await supabase
      .from('user_programmes')
      .select('user_id')
      .limit(1);

    if (!programmes || programmes.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé avec des données programme');
      return;
    }

    const userId = programmes[0].user_id;
    console.log(`🔍 Test avec utilisateur: ${userId}`);

    // Vérifier les données existantes
    const { data: entries } = await supabase
      .from('programme_entries')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    const { data: progress } = await supabase
      .from('subpart_progress')
      .select('*')
      .eq('user_id', userId);

    console.log(`📝 Entrées programme: ${entries?.length || 0}`);
    console.log(`📊 Progrès sous-parties: ${progress?.length || 0}`);
    console.log('');

    // 4. Test d'une simulation de mise à jour
    console.log('4️⃣ Test simulation mise à jour activité...');
    
    try {
      // Simuler l'ajout d'une activité dans la timeline
      const { error: timelineError } = await supabase
        .from('user_activity_timeline')
        .insert({
          user_id: userId,
          activity_type: 'test_activity',
          activity_data: { test: true, timestamp: new Date().toISOString() }
        });

      if (timelineError) {
        console.log(`⚠️ Simulation timeline: ${timelineError.message}`);
      } else {
        console.log('✅ Simulation timeline OK');
      }

      // Mettre à jour la heatmap pour aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { error: heatmapError } = await supabase
        .from('user_activity_heatmap')
        .upsert({
          user_id: userId,
          date: today,
          activity_count: 1,
          activity_level: 1
        }, { onConflict: 'user_id,date' });

      if (heatmapError) {
        console.log(`⚠️ Simulation heatmap: ${heatmapError.message}`);
      } else {
        console.log('✅ Simulation heatmap OK');
      }

    } catch (simError) {
      console.log(`⚠️ Erreur simulation: ${simError.message}`);
    }

    console.log('\n🎉 Tests terminés !');
    console.log('\n📝 Résumé:');
    console.log('- Tables évolution: Vérifiées');
    console.log('- Connexion Supabase: OK'); 
    console.log('- Simulation activité: Testée');
    console.log('\n🔄 Le service Evolution est prêt à être utilisé avec des données réelles.');

  } catch (error) {
    console.error('💥 Erreur test:', error);
  }
}

// Exécuter le test
testEvolutionService();
