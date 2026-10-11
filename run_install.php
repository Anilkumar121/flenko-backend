<?php
header('Content-Type: text/plain');

echo "=== PASSENGER & NODE DEEP INSPECTION ===\n\n";

$cmds = [
    'passenger-config about ruby-command',
    'passenger-config about nodejs-command',
    'passenger-config --root',
    'find /home3/theraiat -maxdepth 3 -name node -o -name npm',
    'find /usr/local -name node -o -name npm 2>/dev/null',
    'find /opt -maxdepth 3 2>/dev/null',
    'ls -la /home3/theraiat'
];

foreach ($cmds as $c) {
    echo "--- $c ---\n";
    $out = [];
    exec("$c 2>&1", $out);
    echo implode("\n", $out) . "\n\n";
}
