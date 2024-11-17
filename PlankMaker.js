import org.dreambot.api.methods.MethodProvider;
import org.dreambot.api.methods.container.impl.bank.Bank;
import org.dreambot.api.methods.container.impl.Inventory;
import org.dreambot.api.methods.map.Area;
import org.dreambot.api.methods.walking.Walking;
import org.dreambot.api.methods.widget.Widgets;
import org.dreambot.api.script.AbstractScript;
import org.dreambot.api.script.Category;
import org.dreambot.api.script.ScriptManifest;

import javax.swing.*;
import java.awt.*;
import java.util.concurrent.atomic.AtomicBoolean;

@ScriptManifest(
    name = "Plank Maker with GUI",
    description = "Turns logs into planks in the Woodcutting Guild with a GUI for log selection.",
    author = "YourName",
    version = 1.1,
    category = Category.MISC
)
public class PlankMaker extends AbstractScript {

    private static final Area BANK_AREA = new Area(1657, 3500, 1660, 3497); // Replace with the Woodcutting Guild Bank area
    private static final Area SAWMILL_AREA = new Area(1668, 3492, 1671, 3489); // Replace with the Sawmill area
    private String selectedLogType = null;
    private final AtomicBoolean guiComplete = new AtomicBoolean(false);

    @Override
    public void onStart() {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("Plank Maker Settings");
            frame.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
            frame.setLayout(new GridLayout(0, 1));
            frame.setSize(300, 150);

            JLabel label = new JLabel("Select the type of log to process:");
            frame.add(label);

            JComboBox<String> logTypeComboBox = new JComboBox<>(new String[]{"Normal logs", "Oak logs", "Teak logs", "Mahogany logs"});
            frame.add(logTypeComboBox);

            JButton startButton = new JButton("Start Script");
            startButton.addActionListener(e -> {
                selectedLogType = (String) logTypeComboBox.getSelectedItem();
                guiComplete.set(true);
                frame.dispose();
            });
            frame.add(startButton);

            frame.setVisible(true);
        });

        MethodProvider.log("Waiting for GUI input...");
        while (!guiComplete.get()) {
            sleep(500);
        }
        MethodProvider.log("Selected log type: " + selectedLogType);
    }

    @Override
    public int onLoop() {
        if (selectedLogType == null) {
            stop(); // Stops the script if no log type is selected (failsafe)
            return -1;
        }

        if (!Inventory.contains(selectedLogType)) {
            bankLogs();
        } else if (!SAWMILL_AREA.contains(getLocalPlayer())) {
            walkToSawmill();
        } else {
            makePlanks();
        }
        return 600; // Wait 600 ms before the next loop
    }

    private void bankLogs() {
        if (!BANK_AREA.contains(getLocalPlayer())) {
            Walking.walk(BANK_AREA.getRandomTile());
            MethodProvider.sleepUntil(() -> BANK_AREA.contains(getLocalPlayer()), 5000);
        } else {
            if (!Bank.isOpen()) {
                Bank.open();
                MethodProvider.sleepUntil(Bank::isOpen, 5000);
            } else {
                Bank.depositAllExcept(selectedLogType);
                if (Bank.contains(selectedLogType)) {
                    Bank.withdrawAll(selectedLogType);
                    MethodProvider.sleepUntil(() -> Inventory.contains(selectedLogType), 5000);
                } else {
                    MethodProvider.log("No more logs available in the bank. Stopping script.");
                    stop(); // Stop the script if no logs are available
                }
            }
        }
    }

    private void walkToSawmill() {
        Walking.walk(SAWMILL_AREA.getRandomTile());
        MethodProvider.sleepUntil(() -> SAWMILL_AREA.contains(getLocalPlayer()), 5000);
    }

    private void makePlanks() {
        // Interact with the Sawmill NPC or object
        if (Widgets.getWidgetChild(403, 2) != null) { // Replace widget IDs with actual plank-making interface IDs
            Widgets.getWidgetChild(403, 2).interact(); // Adjust interaction based on log type
            MethodProvider.sleep(3000); // Wait for planks to be made
        } else {
            getGameObjects().closest("Sawmill").interact("Make-plank");
            MethodProvider.sleepUntil(() -> !Inventory.contains(selectedLogType), 5000);
        }
    }

    @Override
    public void onExit() {
        log("Plank Maker script stopped.");
    }
}
