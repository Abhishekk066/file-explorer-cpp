#include <iostream>
using namespace std;

int main() {
    int matrix[2][2], lower[2][2], upper[2][2];

    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            cout << "Enter number for position (" << i << ", " << j << "): ";
            cin >> matrix[i][j];
        }
    }

    for (int m = 0; m < 2; m++) {
        for (int n = 0; n < 2; n++) {
            if (m >= n) {
                lower[m][n] = matrix[m][n];
            }
            if (m <= n) {
                upper[m][n] = matrix[m][n];
            }
        }
    }

    cout << "Matrix:" << endl;
    for (int m = 0; m < 2; m++) {
        for (int n = 0; n < 2; n++) {
            cout << matrix[m][n] << " ";
        }
        cout << endl;
    }

    cout << "Lower triangular elements:" << endl;
    for (int m = 0; m < 2; m++) {
        for (int n = 0; n < 2; n++) {
            if (m >= n) {
                cout << lower[m][n] << " ";
            } else {
                cout << "  ";
            }
        }
        cout << endl;
    }

    cout << "Upper triangular elements:" << endl;
    for (int m = 0; m < 2; m++) {
        for (int n = 0; n < 2; n++) {
            if (m <= n) {
                cout << upper[m][n] << " ";
            } else {
                cout << "  ";
            }
        }
        cout << endl;
    }

    return 0;
}
